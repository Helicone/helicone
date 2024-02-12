# unist-util-remove

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[unist][] utility to remove all nodes that pass a test from the tree.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`remove(tree[, options], test)`](#removetree-options-test)
    *   [`Options`](#options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This is a small utility that helps you clean a tree by removing some stuff.

## When should I use this?

You can use this utility to remove things from a tree.
This utility is very similar to [`unist-util-filter`][unist-util-filter], which
creates a new tree.
Modifying a tree like this utility `unist-util-remove` does is much faster on
larger documents though.

You can also walk the tree with [`unist-util-visit`][unist-util-visit] to remove
nodes.
To create trees, use [`unist-builder`][unist-builder].

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+ and 16.0+), install with [npm][]:

```sh
npm install unist-util-remove
```

In Deno with [`esm.sh`][esmsh]:

```js
import {remove} from 'https://esm.sh/unist-util-remove@3'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {remove} from 'https://esm.sh/unist-util-remove@3?bundle'
</script>
```

## Use

```js
import {u} from 'unist-builder'
import {remove} from 'unist-util-remove'

const tree = u('root', [
  u('leaf', '1'),
  u('parent', [
    u('leaf', '2'),
    u('parent', [u('leaf', '3'), u('other', '4')]),
    u('parent', [u('leaf', '5')])
  ]),
  u('leaf', '6')
])

// Remove all nodes of type `leaf`.
remove(tree, 'leaf')

console.dir(tree, {depth: null})
```

Yields:

```js
{
  type: 'root',
  children: [
    {
      type: 'parent',
      children: [{type: 'parent', children: [{type: 'other', value: '4'}]}]
    }
  ]
}
```

> 👉 **Note**: the parent of leaf `5` is also removed, `options.cascade` can
> change that.

## API

This package exports the identifier [`remove`][api-remove].
There is no default export.

### `remove(tree[, options], test)`

Change the given `tree` by removing all nodes that pass `test`.

The tree is walked in *[preorder][]* (NLR), visiting the node itself, then its
head, etc.

###### Parameters

*   `tree` ([`Node`][node])
    — tree to change
*   `options` ([`Options`][api-options], optional)
    — configuration
*   `test` ([`Test`][test], optional)
    — `unist-util-is` compatible test

###### Returns

A changed given `tree`, without nodes that pass `test`.

`null` is returned if `tree` itself didn’t pass the test or is cascaded away.

### `Options`

Configuration (TypeScript type).

###### Fields

*   `cascade` (`boolean`, default: `true`)
    — whether to drop parent nodes if they had children, but all their children
    were filtered out

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`Options`][api-options].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Related

*   [`unist-util-filter`](https://github.com/syntax-tree/unist-util-filter)
    — create a new tree with all nodes that pass the given function
*   [`unist-util-flatmap`](https://gitlab.com/staltz/unist-util-flatmap)
    — create a new tree by expanding a node into many
*   [`unist-util-map`](https://github.com/syntax-tree/unist-util-map)
    — create a new tree by mapping nodes
*   [`unist-util-select`](https://github.com/syntax-tree/unist-util-select)
    — select nodes with CSS-like selectors
*   [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit)
    — walk the tree
*   [`unist-builder`](https://github.com/syntax-tree/unist-builder)
    — create trees

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © Eugene Sharygin

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/unist-util-filter/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/unist-util-filter/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/unist-util-filter.svg

[coverage]: https://codecov.io/github/syntax-tree/unist-util-filter

[downloads-badge]: https://img.shields.io/npm/dm/unist-util-filter.svg

[downloads]: https://www.npmjs.com/package/unist-util-filter

[size-badge]: https://img.shields.io/bundlephobia/minzip/unist-util-filter.svg

[size]: https://bundlephobia.com/result?p=unist-util-filter

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

[preorder]: https://github.com/syntax-tree/unist#preorder

[test]: https://github.com/syntax-tree/unist-util-is#test

[unist-util-filter]: https://github.com/syntax-tree/unist-util-filter

[unist-util-visit]: https://github.com/syntax-tree/unist-util-visit

[unist-builder]: https://github.com/syntax-tree/unist-builder

[api-remove]: #removetree-options-test

[api-options]: #options
