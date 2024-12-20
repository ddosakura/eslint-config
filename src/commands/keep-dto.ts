/* eslint-disable ts/strict-boolean-expressions */

import type { TSESTree } from '@typescript-eslint/types'
import { AST_NODE_TYPES } from '@typescript-eslint/types'
import { defineCommand } from 'eslint-plugin-command/commands'
import MagicString from 'magic-string'

export interface KeepDtoInlineOptions {
  /**
   * normalizeKey
   *
   * @defalut 'camelize'
   */
  key: false | 'camelize' | 'pascalize' | 'underlize'
  /** ignore both normalizeKey & type annotation */
  ignores: string[]
  /**
   * - <default>: [{a: 1}, 1] => [{ a: number }, number]
   * - 'asArray': [{a: 1}, 1] => { a: number }[]
   */
  tuple: 'asArray'
  /**
   * handle TSLiteralType in TSUnionType & TSIntersectionType
   *
   * @defalut false
   */
  literal: false | 'all' | 'union' | 'intersection'
  /**
   * Custom Utility Types
   */
  utilities: Record<string, number | number[]>
}

function normalizeKey(key: string, mode: KeepDtoInlineOptions['key'] = 'camelize') {
  // @regex101 https://regex101.com/?regex=%5E%5Ba-z_%24%5D%5B%5Cw%24%5D*%24&flags=i&flavor=javascript
  if (!/^[a-z_$][\w$]*$/i.test(key)) return false
  if (!mode) return key
  if (mode === 'underlize') {
    return key.replace(/[A-Z]/g, $0 => `_${$0.toLowerCase()}`).replace(/^_/, '')
  }
  const newKey = key.replace(/_([a-z])/gi, (_, $1: string) => $1.toUpperCase())
  const first = newKey[0]
  return newKey.replace(first, mode === 'pascalize' ? first.toUpperCase() : first.toLowerCase())
}

function withPrefix(key: string, prefix = '') {
  return prefix ? `${prefix}.${key}` : key
}

// @regex101 https://regex101.com/?regex=%5E%5B%2F%40%3A%5D%5Cs*%28%3F%3Akeep-dto%7Cdto%29%5Cs*%28%5C%7B.*%5C%7D%29%3F%24&flavor=javascript
const reLine = /^[/@:]\s*(?:keep-dto|dto)\s*(\{.*\})?$/
// @regex101 https://regex101.com/?regex=%28%3F%3A%5Cb%7C%5Cs%29%40keep-dto%5Cs*%28%5C%7B.*%5C%7D%29%3F%28%3F%3A%5Cb%7C%5Cs%7C%24%29&flavor=javascript
const reBlock = /(?:\b|\s)@keep-dto\s*(\{.*\})?(?:\b|\s|$)/

const typeReferences = {
  $1_0: ['Array', 'Partial', 'Required', 'Readonly', 'NonNullable'],
  $2_0: ['Pick', 'Omit'],
  $2_1: ['Record'],
}

export const keepDto = defineCommand({
  name: 'keep-dto',
  commentType: 'both',
  match: comment => comment.value.trim().match(comment.type === 'Line' ? reLine : reBlock),
  action(ctx) {
    const optionsRaw = ctx.matches[1] || '{}'
    let options: Partial<KeepDtoInlineOptions> | null = null
    try {
      // eslint-disable-next-line ts/no-unsafe-assignment
      options = JSON.parse(optionsRaw)
    }
    catch {
      return ctx.reportError(`Failed to parse options: ${optionsRaw}`)
    }

    const types = [
      AST_NODE_TYPES.TSInterfaceDeclaration as const,
      AST_NODE_TYPES.TSTypeAliasDeclaration as const,
    ]
    const raw = ctx.findNodeBelow({ types, shallow: false, findAll: false })
    const node = raw || ((node) => {
      const type = node?.declaration?.type
      if (type && (types as AST_NODE_TYPES[]).includes(type)) return node.declaration as unknown as typeof raw
    })(ctx.findNodeBelow(AST_NODE_TYPES.ExportNamedDeclaration))
    if (!node) return ctx.reportError('Unable to find dto')

    const [from, to] = node.range
    const rawContent = ctx.source.text.slice(from, to)
    const s = new MagicString(rawContent)
    function replace(range: TSESTree.Range, content: string | ((content: string) => string)) {
      const start = range[0] - from
      const end = range[1] - from
      s.update(start, end, typeof content === 'string' ? content : content(s.slice(start, end)))
    }
    function formatTSLiteralType(tsLiteralType: TSESTree.TSLiteralType) {
      if (tsLiteralType.literal.type === AST_NODE_TYPES.Literal) {
        replace(tsLiteralType.range, typeof tsLiteralType.literal.value)
      }
      // e.g. -1
      else if (
        tsLiteralType.literal.type === AST_NODE_TYPES.UnaryExpression
        && tsLiteralType.literal.operator === '-'
        && tsLiteralType.literal.argument.type === AST_NODE_TYPES.Literal
        && typeof tsLiteralType.literal.argument.value === 'number'
      ) {
        replace(tsLiteralType.range, 'number')
      }
    }

    function getNewKey(rawKey: string, prefix: string) {
      if (options?.ignores?.includes(`.${rawKey}`)) return
      const key = withPrefix(rawKey, prefix)
      if (options?.ignores?.includes(key)) return
      return key
    }
    function formatTypeNode(typeNode: TSESTree.TypeNode, prefix = '') {
      if (typeNode.type === AST_NODE_TYPES.TSLiteralType) {
        formatTSLiteralType(typeNode)
      }
      else if (typeNode.type === AST_NODE_TYPES.TSArrayType) {
        formatTypeNode(typeNode.elementType, prefix)
      }
      else if (typeNode.type === AST_NODE_TYPES.TSTypeLiteral) {
        run(typeNode.members, prefix)
      }
      else if (typeNode.type === AST_NODE_TYPES.TSUnionType || typeNode.type === AST_NODE_TYPES.TSIntersectionType) {
        const ignore = !(options?.literal === 'all'
          || (typeNode.type === AST_NODE_TYPES.TSUnionType && options?.literal === 'union')
          || (typeNode.type === AST_NODE_TYPES.TSIntersectionType && options?.literal === 'intersection'))
        typeNode.types.forEach((el, index) => {
          if (ignore && el.type === AST_NODE_TYPES.TSLiteralType) return
          const key = getNewKey(`${index}`, prefix)
          if (!key) return
          formatTypeNode(el, key)
        })
      }
      else if (typeNode.type === AST_NODE_TYPES.TSTupleType) {
        if (options?.tuple === 'asArray') {
          /**
           * remove
           *
           * 1. second element
           * 2. ch after first element, e.g. ','、'\n' etc.
           */
          if (typeNode.elementTypes.length > 0) {
            const start = typeNode.elementTypes[0].range[1] + 1
            const end = typeNode.range[1]
            if (start < end) {
              replace([start, end], '')
            }
            formatTypeNode(typeNode.elementTypes[0], prefix)
            replace(typeNode.range, c => `${c.slice(1, -1).trimStart()}[]`)
          }
        }
        else {
          typeNode.elementTypes.forEach(item => formatTypeNode(item, prefix))
        }
      }
      else if (typeNode.type === AST_NODE_TYPES.TSTypeReference) {
        const params = typeNode.typeArguments?.params
        if (typeNode.typeName.type === AST_NODE_TYPES.Identifier) {
          if (typeReferences.$1_0.includes(typeNode.typeName.name) && params?.length === 1) {
            formatTypeNode(params[0], prefix)
          }
          else if (typeReferences.$2_0.includes(typeNode.typeName.name) && params?.length === 2) {
            formatTypeNode(params[0], prefix)
          }
          else if (typeReferences.$2_1.includes(typeNode.typeName.name) && params?.length === 2) {
            formatTypeNode(params[1], prefix)
          }
          else {
            const opt = options?.utilities?.[typeNode.typeName.name] ?? []
            const indexes = Array.isArray(opt) ? opt : [opt]
            const max = Math.max(...indexes)
            if (params && params.length > max) {
              indexes.forEach(index => formatTypeNode(params[index], prefix))
            }
          }
        }
      }
    }
    function run(els: TSESTree.TypeElement[], prefix = '') {
      for (const el of els) {
        if (el.type !== AST_NODE_TYPES.TSPropertySignature) continue

        const rawKey = (() => {
          if (el.key.type === AST_NODE_TYPES.Literal) return el.key.value as string
          if (el.key.type === AST_NODE_TYPES.Identifier) return el.key.name
        })()
        if (!rawKey) continue
        const key = getNewKey(rawKey, prefix)
        if (!key) continue
        const identifier = normalizeKey(rawKey, options?.key)
        if (identifier) replace(el.key.range, identifier)
        const newKey = identifier ? withPrefix(identifier, prefix) : key

        if (!el.typeAnnotation) continue
        formatTypeNode(el.typeAnnotation.typeAnnotation, newKey)
      }
    }
    if (node.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
      run(node.body.body)
    }
    else if (node.type === AST_NODE_TYPES.TSTypeAliasDeclaration) {
      formatTypeNode(node.typeAnnotation)
    }
    else {
      return ctx.reportError('dto type error')
    }

    const newContent = s.toString()
    if (newContent === rawContent) return false

    ctx.report({
      node,
      message: 'Keep DTO',
      removeComment: false,
      fix(fixer) {
        return fixer.replaceText(node, newContent)
      },
    })
  },
})
