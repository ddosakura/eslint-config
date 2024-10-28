# `keep-dto`

Keep the DTO(data transfer object) interface normalized.

## Triggers

- `/// keep-dto`
- `// @keep-dto`

## Examples

```ts
interface A {
  a: 1
  b: 1 | 2
}
```

Will be converted to:

```ts
/// keep-dto
interface A {
  a: number
  b: 1 | 2
}
```

#### normalizeKey

```ts
// @keep-dto { "key": false }
interface A {
  ab_cd: number
  abCd: number
}
```

  key: false | 'camelize' | 'pascalize' | 'underlize'

```ts
/// keep-dto
interface A {
  abCd: number
}

/// keep-dto { "key": "camelize" }
interface B {
  abCd: number
}
```

```ts
// @keep-dto { "key": "pascalize" }
interface A {
  AbCd: number
}
```

```ts
// @keep-dto { "key": "underlize" }
interface A {
  ab_cd: number
}
```

#### ignore both normalizeKey & type annotation

```ts
// @keep-dto { "key": "underlize", "ignores": ["abC"] }
export interface Foo {
  ab_cd: number
  abC: 1
}

// @keep-dto { "ignores": ["eF.g_h", ".j_k"] }
// eslint-disable-next-line ts/consistent-type-definitions
type Bar = {
  aB: { cD: number, j_k: 1 }
  eF: { g_h: 1, j_k: 1 }[]
  i: string[]
}
```

#### about tuple

```ts
interface Foo {
  a: [{ b: 1 }]
}
```

Will be converted to:

```ts
// @keep-dto { "tuple": "asArray" }
interface Foo {
  a: { b: number }[]
}
```

#### work with `keep-sorted`

```ts
/// keep-dto
/// keep-sorted
interface A {
  a: number
  b: number
}
```

#### TSUnionType & TSIntersectionType

```ts
export type A = 1 | { a_b: 2 } & 3
```

Will be converted to:

```ts
// @keep-dto
export type A = 1 | { aB: number } & 3
```

```ts
// @keep-dto { "literal": "all", "ignores": ["0", "1.0.a_b"] }
export type A = 1 | { a_b: 2 } & number
```

#### Utility Types & Custom Utility Types

buildin:

- Array
- Partial
- Required
- Readonly
- NonNullable
- Pick
- Omit
- Record

custom:

```ts
type X<A, B, C> = A | B | C
// @keep-dto { "utilities": { "Awaited": 0, "Promise": 0, "X": [0, 2] } }
export interface A {
  a: Awaited<Promise<{ a: number }>>
  b: X<{ a: number }, { b: 2 }, { c: number }>
}
```
