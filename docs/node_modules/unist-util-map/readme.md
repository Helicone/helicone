# unist-util-map

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[unist][] utility to create a new tree by mapping all nodes with a given
function.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`map(tree, mapFunction)`](#maptree-mapfunction)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This is a small utility that helps you make new trees.

## When should I use this?

You can use this utility to create a new tree by mapping all nodes with a given
function.
Creating new trees like this can lead to performance problems, as it creates
new objects for every node.
When dealing with potentially large trees, and relatively few changes, use
[`unist-util-visit`][unist-util-visit] (or
[`unist-util-visit-parents`][unist-util-visit-parents]) instead.

To remove certain nodes, you can also walk the tree with `unist-util-visit`, or
use [`unist-util-filter`][unist-util-filter] (clones the tree instead of
mutating) or [`unist-util-remove`][unist-util-remove] (mutates).
To create trees, use [`unist-builder`][unist-builder].

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+ and 16.0+), install with [npm][]:

```sh
npm install unist-util-map
```

In Deno with [`esm.sh`][esmsh]:

```js
import {map} from 'https://esm.sh/unist-util-map@3'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {map} from 'https://esm.sh/unist-util-map@3?bundle'
</script>
```

## Use

```js
import {u} from 'unist-builder'
import {map} from 'unist-util-map'

const tree = u('tree', [
  u('leaf', 'leaf 1'),
  u('node', [u('leaf', 'leaf 2')]),
  u('void'),
  u('leaf', 'leaf 3')
])

const next = map(tree, (node) => {
  return node.type === 'leaf'
    ? Object.assign({}, node, {value: 'CHANGED'})
    : node
})

console.dir(next, {depth: null})
```

Yields:

```js
{
  type: 'tree',
  children: [
    {type: 'leaf', value: 'CHANGED'},
    {type: 'node', children: [{type: 'leaf', value: 'CHANGED'}]},
    {type: 'void'},
    {type: 'leaf', value: 'CHANGED'}
  ]
}
```

> 👉 **Note**: `next` is a changed clone and `tree` is not mutated.

## API

This package exports the identifier [`map`][api-map].
There is no default export.

### `map(tree, mapFunction)`

Create a new tree by mapping all nodes with the given function.

###### Parameters

*   `tree` ([`Node`][node])
    — tree to map
*   `mapFunction` ([`MapFunction`][api-mapfunction])
    — function called with a node, its index, and its parent to produce a new
    node

###### Returns

New mapped tree ([`Node`][node]).

#### `MapFunction`

Function called with a node, its index, and its parent to produce a new
node (TypeScript type).

###### Parameters

*   `node` ([`Node`][node])
    — node to map
*   `index` (`number` or `undefined`)
    — index of `node` in `parent` (if any)
*   `parent` ([`Node`][node] or `undefined`)
    — parent of `node`

###### Returns

New mapped node ([`Node`][node]).

The children on the returned node are not used.
If the original node has children, those are mapped instead.

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`MapFunction`][api-mapfunction].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Related

*   [`unist-util-filter`](https://github.com/syntax-tree/unist-util-filter)
    — create a new tree with all nodes that pass the given function
*   [`unist-util-flatmap`](https://gitlab.com/staltz/unist-util-flatmap)
    — create a new tree by expanding a node into many
*   [`unist-util-remove`](https://github.com/syntax-tree/unist-util-remove)
    — remove nodes from trees
*   [`unist-util-select`](https://github.com/syntax-tree/unist-util-select)
    — select nodes with CSS-like selectors
*   [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit)
    — walk trees
*   [`unist-builder`](https://github.com/syntax-tree/unist-builder)
    — create trees

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [azu][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/unist-util-map/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/unist-util-map/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/unist-util-map.svg

[coverage]: https://codecov.io/github/syntax-tree/unist-util-map

[downloads-badge]: https://img.shields.io/npm/dm/unist-util-map.svg

[downloads]: https://www.npmjs.com/package/unist-util-map

[size-badge]: https://img.shields.io/bundlephobia/minzip/unist-util-map.svg

[size]: https://bundlephobia.com/result?p=unist-util-map

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

[author]: https://efcl.info

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[unist]: https://github.com/syntax-tree/unist

[node]: https://github.com/syntax-tree/unist#node

[unist-util-visit]: https://github.com/syntax-tree/unist-util-visit

[unist-util-visit-parents]: https://github.com/syntax-tree/unist-util-visit-parents

[unist-util-filter]: https://github.com/syntax-tree/unist-util-filter

[unist-util-remove]: https://github.com/syntax-tree/unist-util-remove

[unist-builder]: https://github.com/syntax-tree/unist-builder

[api-map]: #maptree-mapfunction

[api-mapfunction]: #mapfunction
