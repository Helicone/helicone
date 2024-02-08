# unist-builder

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[unist][] utility to create trees with ease.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`u(type[, props][, children|value])`](#utype-props-childrenvalue)
    *   [`ChildrenOrValue`](#childrenorvalue)
    *   [`Props`](#props)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a hyperscript interface (like `createElement` from React and
`h` from Vue and such) to help with creating unist trees.

## When should I use this?

You can use this utility in your project when you generate syntax trees with
code.
It helps because it replaces most of the repetition otherwise needed in a syntax
tree with function calls.

You can instead use [`hastscript`][hastscript] or [`xastscript`][xastscript]
when creating hast (HTML) or xast (XML) nodes.

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+ and 16.0+), install with [npm][]:

```sh
npm install unist-builder
```

In Deno with [`esm.sh`][esmsh]:

```js
import {u} from 'https://esm.sh/unist-builder@3'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {u} from 'https://esm.sh/unist-builder@3?bundle'
</script>
```

## Use

```js
import {u} from 'unist-builder'

const tree = u('root', [
  u('subtree', {id: 1}),
  u('subtree', {id: 2}, [
    u('node', [u('leaf', 'leaf 1'), u('leaf', 'leaf 2')]),
    u('leaf', {id: 3}, 'leaf 3'),
    u('void', {id: 4})
  ])
])

console.dir(tree, {depth: null})
```

results in the following tree:

```js
{
  type: 'root',
  children: [
    {type: 'subtree', id: 1},
    {
      type: 'subtree',
      id: 2,
      children: [
        {
          type: 'node',
          children: [
            {type: 'leaf', value: 'leaf 1'},
            {type: 'leaf', value: 'leaf 2'}
          ]
        },
        {type: 'leaf', id: 3, value: 'leaf 3'},
        {type: 'void', id: 4}
      ]
    }
  ]
}
```

## API

This package exports the identifier [`u`][u].
There is no default export.

### `u(type[, props][, children|value])`

Build a node.

###### Signatures

*   `u(type[, props], children)` — create a parent ([`Parent`][parent])
*   `u(type[, props], value)` — create a literal ([`Literal`][literal])
*   `u(type[, props])` — create a void node (neither parent not literal)

###### Parameters

*   `type` (`string`)
    — node type
*   `props` (`Record<string, unknown>`)
    — fields assigned to node
*   `children` ([`Array<Node>`][node])
    — children of node
*   `value` (`*`)
    — value of `node` (cast to string)

###### Returns

Built node ([`Node`][node]).

### `ChildrenOrValue`

List to use as `children` or value to use as `value` (TypeScript type).

###### Type

```ts
type ChildrenOrValue = Array<Node> | string
```

### `Props`

Other fields to add to the node (TypeScript type).

###### Type

```ts
export type Props = Record<string, unknown>
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`ChildrenOrValue`][childrenorvalue] and
[`Props`][props].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Related

*   [`hastscript`](https://github.com/syntax-tree/hastscript)
    — create [hast][] trees
*   [`xastscript`](https://github.com/syntax-tree/xastscript)
    — create [xast][] trees

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © Eugene Sharygin

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/unist-builder/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/unist-builder/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/unist-builder.svg

[coverage]: https://codecov.io/github/syntax-tree/unist-builder

[downloads-badge]: https://img.shields.io/npm/dm/unist-builder.svg

[downloads]: https://www.npmjs.com/package/unist-builder

[size-badge]: https://img.shields.io/bundlephobia/minzip/unist-builder.svg

[size]: https://bundlephobia.com/result?p=unist-builder

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[license]: license

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[unist]: https://github.com/syntax-tree/unist

[node]: https://github.com/syntax-tree/unist#node

[parent]: https://github.com/syntax-tree/unist#parent

[literal]: https://github.com/syntax-tree/unist#literal

[hast]: https://github.com/syntax-tree/hast

[xast]: https://github.com/syntax-tree/xast

[hastscript]: https://github.com/syntax-tree/hastscript

[xastscript]: https://github.com/syntax-tree/xastscript

[u]: #utype-props-childrenvalue

[props]: #props

[childrenorvalue]: #childrenorvalue
