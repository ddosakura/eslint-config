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

const reLine = /^[/@:]\s*(?:keep-dto|dto)\s*(\{.*\})?$/
const reBlock = /(?:\b|\s)@keep-dto\s*(\{.*\})?(?:\b|\s|$)/

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

    const node = ctx.findNodeBelow(AST_NODE_TYPES.TSInterfaceBody)
    if (!node) return ctx.reportError('Unable to find dto')

    const [from, to] = node.range
    const rawContent = ctx.source.text.slice(from, to)
    const s = new MagicString(rawContent)
    function replace(range: TSESTree.Range, content: string) {
      s.update(range[0] - from, range[1] - from, content)
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
    function run(els: TSESTree.TypeElement[], prefix = '') {
      for (const el of els) {
        if (el.type !== AST_NODE_TYPES.TSPropertySignature) continue

        const rawKey = (() => {
          if (el.key.type === AST_NODE_TYPES.Literal) return el.key.value as string
          if (el.key.type === AST_NODE_TYPES.Identifier) return el.key.name
        })()
        if (!rawKey) continue
        if (options?.ignores?.includes(`.${rawKey}`)) continue
        const key = withPrefix(rawKey, prefix)
        if (options?.ignores?.includes(key)) continue
        const identifier = normalizeKey(rawKey, options?.key)
        if (identifier) replace(el.key.range, identifier)
        const newKey = identifier ? withPrefix(identifier, prefix) : key

        if (!el.typeAnnotation) continue
        function formatTypeNode(typeNode: TSESTree.TypeNode) {
          if (typeNode.type === AST_NODE_TYPES.TSLiteralType) {
            formatTSLiteralType(typeNode)
          }
          else if (typeNode.type === AST_NODE_TYPES.TSArrayType) {
            formatTypeNode(typeNode.elementType)
          }
          else if (typeNode.type === AST_NODE_TYPES.TSTypeLiteral) {
            run(typeNode.members, newKey)
          }
        }
        formatTypeNode(el.typeAnnotation.typeAnnotation)
      }
    }
    run(node.body)

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
