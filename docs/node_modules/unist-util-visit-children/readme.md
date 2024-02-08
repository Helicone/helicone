# unist-util-visit-children

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[unist][] utility to visit direct children of a parent.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`visitChildren(visitor)`](#visitchildrenvisitor)
    *   [`Visitor`](#visitor)
    *   [`Visit`](#visit)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This is a tiny utility that you can use to create a reusable function that
only visits direct children.

## When should I use this?

Probably never!
Use [`unist-util-visit`][unist-util-visit].

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+ and 16.0+), install with [npm][]:

```sh
npm install unist-util-visit-children
```

In Deno with [`esm.sh`][esmsh]:

```js
import {visitChildren} from 'https://esm.sh/unist-util-visit-children@2'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {visitChildren} from 'https://esm.sh/unist-util-visit-children@2?bundle'
</script>
```

## Use

```js
import u from 'unist-builder'
import {visitChildren} from 'unist-util-visit-children'

const visit = visitChildren(function (node) {
  console.log(node)
})

const tree = u('tree', [
  u('leaf', 'leaf 1'),
  u('node', [u('leaf', 'leaf 2'), u('leaf', 'leaf 3')]),
  u('leaf', 'leaf 4'),
  u('void')
])

visit(tree)
```

Yields:

```js
{type: 'leaf', value: 'leaf 1'}
{
  type: 'node',
  children: [
    {type: 'leaf', value: 'leaf 2'},
    {type: 'leaf', value: 'leaf 3'}
  ]
}
{type: 'leaf', value: 'leaf 4'}
{type: 'void'}
```

## API

This package exports the identifier [`visitChildren`][api-visitchildren].
There is no default export.

### `visitChildren(visitor)`

Wrap `visitor` to be called for each child in the nodes later given to `visit`.

###### Parameters

*   `visitor` ([`Visitor`][api-visitor])
    — callback called for each `child` in `parent` later given to `visit`

###### Returns

Function to call the bound `visitor` for each child in `parent`
([`Visit`][api-visit]).

### `Visitor`

Callback called for each `child` in `parent` later given to `visit`
(TypeScript type).

###### Parameters

*   `child` ([`Node`][node])
    — child of parent
*   `index` (`number`)
    — position of `child` in parent
*   `parent` ([`Node`][node])
    — parent node

###### Returns

Nothing (`void`).

### `Visit`

Function to call the bound `visitor` for each child in `parent`
(TypeScript type).

###### Parameters

*   `parent` ([`Node`][node])
    — parent node

###### Returns

Nothing (`void`).

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`Visit`][api-visit] and
[`Visitor`][api-visitor].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Related

*   [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit)
    — walk the tree
*   [`unist-util-visit-parents`](https://github.com/syntax-tree/unist-util-visit-parents)
    — walk the tree with a stack of parents
*   [`unist-util-filter`](https://github.com/syntax-tree/unist-util-filter)
    — create a new tree with all nodes that pass a test
*   [`unist-util-map`](https://github.com/syntax-tree/unist-util-map)
    — create a new tree with all nodes mapped by a given function
*   [`unist-util-flatmap`](https://gitlab.com/staltz/unist-util-flatmap)
    — create a new tree by mapping (to an array) with the given function
*   [`unist-util-find-all-after`](https://github.com/syntax-tree/unist-util-find-all-after)
    — find nodes after another node
*   [`unist-util-find-all-before`](https://github.com/syntax-tree/unist-util-find-all-before)
    — find nodes before another node
*   [`unist-util-find-after`](https://github.com/syntax-tree/unist-util-find-after)
    — find a node after another node
*   [`unist-util-find-before`](https://github.com/syntax-tree/unist-util-find-before)
    — find a node before another node
*   [`unist-util-find-all-between`](https://github.com/mrzmmr/unist-util-find-all-between)
    — find all nodes between two nodes
*   [`unist-util-remove`](https://github.com/syntax-tree/unist-util-remove)
    — remove nodes from a tree that pass a test
*   [`unist-util-select`](https://github.com/syntax-tree/unist-util-select)
    — select nodes with CSS-like selectors

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://github.com/syntax-tree/unist-util-visit-children/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/unist-util-visit-children/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/unist-util-visit-children.svg

[coverage]: https://codecov.io/github/syntax-tree/unist-util-visit-children

[downloads-badge]: https://img.shields.io/npm/dm/unist-util-visit-children.svg

[downloads]: https://www.npmjs.com/package/unist-util-visit-children

[size-badge]: https://img.shields.io/bundlephobia/minzip/unist-util-visit-children.svg

[size]: https://bundlephobia.com/result?p=unist-util-visit-children

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

[author]: https://wooorm.com

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[unist]: https://github.com/syntax-tree/unist

[node]: https://github.com/syntax-tree/unist#nodes

[unist-util-visit]: https://github.com/syntax-tree/unist-util-visit

[api-visitchildren]: #visitchildrenvisitor

[api-visit]: #visit

[api-visitor]: #visitor
