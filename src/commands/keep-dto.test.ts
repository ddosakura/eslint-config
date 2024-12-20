import { keepSorted } from 'eslint-plugin-command/commands'
import { $, run } from './_test-utils'
import { keepDto } from './keep-dto'

run(
  [keepDto, keepSorted],
  $`
    // @keep-dto
    interface Foo {
      bar: string
      baz: 1 | 2
    }
  `,
  {
    description: 'example',
    code: $`
      // @keep-dto
      export interface Foo {
        a: 1
        'b': true
        '0c': string
        'd-e': 1 | 2
        'f_g': 'baz'
        h: number
        i: boolean
      }
    `,
    output: $`
      // @keep-dto
      export interface Foo {
        a: number
        b: boolean
        '0c': string
        'd-e': 1 | 2
        fG: string
        h: number
        i: boolean
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'no normalizeKey',
    code: $`
      // @keep-dto { "key": false }
      export interface Foo {
        'a_b': 1
      }
    `,
    output: $`
      // @keep-dto { "key": false }
      export interface Foo {
        a_b: number
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'pascalizeKey',
    code: $`
      // @keep-dto { "key": "pascalize" }
      export interface Foo {
        'ab_cd': 1
      }
    `,
    output: $`
      // @keep-dto { "key": "pascalize" }
      export interface Foo {
        AbCd: number
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'underlizeKey',
    code: $`
      // @keep-dto { "key": "underlize" }
      export interface Foo {
        AbCd: 1
        abC: 1
      }
    `,
    output: $`
      // @keep-dto { "key": "underlize" }
      export interface Foo {
        ab_cd: number
        ab_c: number
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'ignore keys',
    code: $`
      // @keep-dto { "key": "underlize", "ignores": ["abC"] }
      export interface Foo {
        AbCd: 1
        abC: 1
      }
    `,
    output: $`
      // @keep-dto { "key": "underlize", "ignores": ["abC"] }
      export interface Foo {
        ab_cd: number
        abC: 1
      }
    `,
    errors: ['command-fix'],
  },
  $`
    // @keep-dto
    // @keep-sorted
    interface Foo {
      bar: string
      baz: 1 | 2
    }
  `,
  {
    description: 'with sorted',
    code: $`
      // @keep-dto
      // @keep-sorted
      export interface Foo {
        baz: 1
        bar: string
      }
    `,
    output: $`
      // @keep-dto
      // @keep-sorted
      export interface Foo {
        bar: string
        baz: number
      }
    `,
    errors: ['command-fix', 'command-fix'],
  },
  {
    description: 'nest',
    code: $`
      // @keep-dto { "ignores": ["eF.g_h", ".j_k"] }
      export interface Foo {
        a_b: { c_d: 1, j_k: 1 }
        e_f: { g_h: 1, j_k: 1 }[]
        i: "sss"[]
      }
    `,
    output: $`
      // @keep-dto { "ignores": ["eF.g_h", ".j_k"] }
      export interface Foo {
        aB: { cD: number, j_k: 1 }
        eF: { g_h: 1, j_k: 1 }[]
        i: string[]
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'UnaryExpression: e.g. -1',
    code: $`
      // @keep-dto
      export interface Foo {
        a: -1
      }
    `,
    output: $`
      // @keep-dto
      export interface Foo {
        a: number
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'more case: 1[][]',
    code: $`
      // @keep-dto
      export interface Foo {
        a: 1[][]
      }
    `,
    output: $`
      // @keep-dto
      export interface Foo {
        a: number[][]
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'TSTupleType: <default>',
    code: $`
      // @keep-dto
      export interface Foo {
        foo: [{ a: 1 }, 1]
      }
    `,
    output: $`
      // @keep-dto
      export interface Foo {
        foo: [{ a: number }, number]
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'TSTupleType: asArray',
    code: $`
      // @keep-dto { "tuple": "asArray" }
      export interface Foo {
        foo: []
        foo1: [{ a: 1 }]
        foo2: [[{ a: 1 }]]
        bar1: [{ a: 1, b: [{ c: 1 }] }]
        bar2: [{
          a: 1
          b1: [
            { c: 1 }
          ]
          b2: [
            { c: 1 },
          ]
        }]
        baz1: [{ a: 1 }, 1]
        baz2: [{ a: number }, number]
        baz3: [{ a: [{ a: number }, number] }, number]
      }
    `,
    output: $`
      // @keep-dto { "tuple": "asArray" }
      export interface Foo {
        foo: []
        foo1: { a: number }[]
        foo2: { a: number }[][]
        bar1: { a: number, b: { c: number }[] }[]
        bar2: {
          a: number
          b1: { c: number }[]
          b2: { c: number }[]
        }[]
        baz1: { a: number }[]
        baz2: { a: number }[]
        baz3: { a: { a: number }[] }[]
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'TSTypeAliasDeclaration',
    code: $`
      // @keep-dto
      export type Foo = {
        a: 1
      }
    `,
    output: $`
      // @keep-dto
      export type Foo = {
        a: number
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'unable find',
    code: $`
      // @keep-dto
      const foo = { a: 1 };
    `,
    output: $`
      // @keep-dto
      const foo = { a: 1 };
    `,
    errors: [{ messageId: 'command-error', message: '[keep-dto] error: Unable to find dto' }],
  },
  {
    // description: 'dto type error',
    description: 'Literal Alias',
    code: $`
      // @keep-dto
      type foo = 1;
    `,
    // output: $`
    //   // @keep-dto
    //   type foo = 1;
    // `,
    // errors: [{ messageId: 'command-error', message: '[keep-dto] error: dto type error' }],
    output: $`
      // @keep-dto
      type foo = number;
    `,
    errors: ['command-fix'],
  },
  {
    description: 'multi interfaces',
    code: $`
      // @keep-dto
      interface A {
        ab_cd: number
      }
      // @keep-dto { "key": "camelize" }
      interface B {
        ab_cd: number
      }
    `,
    output: $`
      // @keep-dto
      interface A {
        abCd: number
      }
      // @keep-dto { "key": "camelize" }
      interface B {
        abCd: number
      }
    `,
    errors: ['command-fix', 'command-fix'],
  },
  {
    description: 'multi export interfaces',
    code: $`
      // @keep-dto
      export interface A2 {
        ab_cd: number
      }
      // @keep-dto { "key": "camelize" }
      export interface B2 {
        ab_cd: number
      }
    `,
    output: $`
      // @keep-dto
      export interface A2 {
        abCd: number
      }
      // @keep-dto { "key": "camelize" }
      export interface B2 {
        abCd: number
      }
    `,
    errors: ['command-fix', 'command-fix'],
  },
  {
    description: 'Record<any, { ... }> & Array<{ ... }>',
    code: $`
      // @keep-dto
      export interface Example {
        record: Record<any, {
          foo: 1
        }>
        record2: Record<1 | 2, {
          foo: 1
        }[]>
        array: Array<{
          foo: 1
        }>
        array2: Array<{
          foo: 1
        }[]>
        mix: Array<Record<number, {
          foo: 1
        }>>
        mix2: Record<string, Array<{
          foo: 1
        }>>
      }
    `,
    output: $`
      // @keep-dto
      export interface Example {
        record: Record<any, {
          foo: number
        }>
        record2: Record<1 | 2, {
          foo: number
        }[]>
        array: Array<{
          foo: number
        }>
        array2: Array<{
          foo: number
        }[]>
        mix: Array<Record<number, {
          foo: number
        }>>
        mix2: Record<string, Array<{
          foo: number
        }>>
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'Array Types Alias',
    code: $`
      // @keep-dto
      export type Tuple = [
        { a: 1 },
        { a: 2 },
      ]
      // @keep-dto { "tuple": "asArray" }
      type Arr = [
        { a: 1 },
        { a: 2 },
      ]
      // @keep-dto { "ignores": ["a_b"] }
      export type Arr2 = Array<{ a: 1, a_b: 2 }>
    `,
    output: $`
      // @keep-dto
      export type Tuple = [
        { a: number },
        { a: number },
      ]
      // @keep-dto { "tuple": "asArray" }
      type Arr = { a: number }[]
      // @keep-dto { "ignores": ["a_b"] }
      export type Arr2 = Array<{ a: number, a_b: 2 }>
    `,
    errors: ['command-fix', 'command-fix', 'command-fix'],
  },
  {
    description: 'Utility Types #0: Record Type Alias',
    code: $`
      // @keep-dto { "ignores": ["a_b"] }
      export type R = Record<any, { a: 1, a_b: 2 }>
    `,
    output: $`
      // @keep-dto { "ignores": ["a_b"] }
      export type R = Record<any, { a: number, a_b: 2 }>
    `,
    errors: ['command-fix'],
  },
  {
    description: 'TSUnionType & TSIntersectionType #1',
    code: $`
      // @keep-dto { "ignores": ["0.a_b", "1.1.c_d"] }
      export type A = { a_b: 1 } | { b_c: 1 } & { c_d: 1 } & { c_d: 1 }
    `,
    output: $`
      // @keep-dto { "ignores": ["0.a_b", "1.1.c_d"] }
      export type A = { a_b: 1 } | { bC: number } & { c_d: 1 } & { cD: number }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'TSUnionType & TSIntersectionType #2.1',
    code: $`
      // @keep-dto { "literal": "all", "ignores": ["0"] }
      export type A = 1 | 2 & 3
    `,
    output: $`
      // @keep-dto { "literal": "all", "ignores": ["0"] }
      export type A = 1 | number & number
    `,
    errors: ['command-fix'],
  },
  {
    description: 'TSUnionType & TSIntersectionType #2.2',
    code: $`
      // @keep-dto { "literal": "all", "ignores": [".0"] }
      export type A = 1 | 2 & 3
    `,
    output: $`
      // @keep-dto { "literal": "all", "ignores": [".0"] }
      export type A = 1 | 2 & number
    `,
    errors: ['command-fix'],
  },
  {
    description: 'Utility Types #1: Partial&Required&Readonly&NonNullable',
    code: $`
      // @keep-dto
      export interface A {
        a: Partial<{ a: 1 }>
        b: Required<{ a?: 1 }>
        c: Readonly<{ a: 1 }>
        d: NonNullable<{ a: 1 } | null>
      }
    `,
    output: $`
      // @keep-dto
      export interface A {
        a: Partial<{ a: number }>
        b: Required<{ a?: number }>
        c: Readonly<{ a: number }>
        d: NonNullable<{ a: number } | null>
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'Utility Types #2: Pick&Omit',
    code: $`
      // @keep-dto
      export interface A {
        a: Pick<{ a: 1 }, 'a'>
        b: Omit<{ a: 1 }, 'a'>
      }
    `,
    output: $`
      // @keep-dto
      export interface A {
        a: Pick<{ a: number }, 'a'>
        b: Omit<{ a: number }, 'a'>
      }
    `,
    errors: ['command-fix'],
  },
  {
    description: 'Utility Types #3: Custom',
    code: $`
      type X<A, B, C> = A | B | C
      // @keep-dto { "utilities": { "Awaited": 0, "Promise": 0, "X": [0, 2] } }
      export interface A {
        a: Awaited<Promise<{ a: 1 }>>
        b: X<{ a: 1 }, { b: 2 }, { c: 3 }>
      }
    `,
    output: $`
      type X<A, B, C> = A | B | C
      // @keep-dto { "utilities": { "Awaited": 0, "Promise": 0, "X": [0, 2] } }
      export interface A {
        a: Awaited<Promise<{ a: number }>>
        b: X<{ a: number }, { b: 2 }, { c: number }>
      }
    `,
    errors: ['command-fix'],
  },
)
