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
    description: 'rest',
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
    description: 'more case: 1[][]',
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
)
