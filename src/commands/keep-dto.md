# `keep-dto`

Keep the DTO(data transfer object) interface normalized.

## Triggers

- `/// keep-dto`
- `// @keep-dto`

## Examples

```ts
interface A {
  a: 1
}
```

Will be converted to:

```ts
/// keep-dto
interface A {
  a: number
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

## Some bug in `keep-sorted`

```ts
/// keep-sorted
const arr = [
  { index: 4, name: 'foo' },
  { index: 2, name: 'bar' },
  { index: 2, name: 'apple' },
  { index: 0, name: 'zip' },
]

const arr2 = [
  { index: 0, name: 'zip' },
  { index: 2, name: 'apple' },
  { index: 2, name: 'bar' },
  { index: 4, name: 'foo' },
]
```

```ts
// https://github.com/antfu/eslint-plugin-command/issues/26
/// ---keep-sorted
const example = {
  apple: '🍏',
  orange: '🍊',
  banana: '🍌',
}
```
