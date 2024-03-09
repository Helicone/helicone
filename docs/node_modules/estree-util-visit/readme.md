# estree-util-visit

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[estree][] (and [esast][]) utility to visit nodes.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`visit(tree, visitor|visitors)`](#visittree-visitorvisitors)
    *   [`CONTINUE`](#continue)
    *   [`EXIT`](#exit)
    *   [`SKIP`](#skip)
    *   [`Action`](#action)
    *   [`ActionTuple`](#actiontuple)
    *   [`Index`](#index)
    *   [`Visitor`](#visitor)
    *   [`Visitors`](#visitors)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a utility that helps you walk the tree.

## When should I use this?

This package helps when dealing with JavaScript ASTs.
Use [`unist-util-visit`][unist-util-visit] for other unist ASTs.

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+ and 16.0+), install with [npm][]:

```sh
npm install estree-util-visit
```

In Deno with [`esm.sh`][esmsh]:

```js
import {visit} from 'https://esm.sh/estree-util-visit@1'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {visit} from 'https://esm.sh/estree-util-visit@1?bundle'
</script>
```

## Use

```js
import {parse} from 'acorn'
import {visit} from 'estree-util-visit'

const tree = parse(
  'export function x() { console.log(1 + "2"); process.exit(3) }',
  {sourceType: 'module', ecmaVersion: 2020}
)

visit(tree, (node) => {
  if (node.type === 'Literal' && 'value' in node) console.log(node.value)
})

// Both enter and leave:
walk(tree, {
  enter(node, field, index, parents) { /* … */ },
  leave(node, field, index, parents) { /* … */ }
})
```

Yields:

```txt
1
"2"
3
```

## API

This package exports the identifiers [`CONTINUE`][continue], [`EXIT`][exit],
[`SKIP`][skip], and [`visit`][visit].
There is no default export.

### `visit(tree, visitor|visitors)`

Visit nodes, with ancestral information.

This algorithm performs [*depth-first*][depth-first]
[*tree traversal*][tree-traversal] in [*preorder*][preorder] (**NLR**) and/or
[*postorder*][postorder] (**LRN**).

Compared to other estree walkers, this does not need a dictionary of which
fields are nodes, because it ducktypes instead.

Walking the tree is an intensive task.
Make use of the return values of the visitor(s) when possible.
Instead of walking a tree multiple times, walk it once, use
[`unist-util-is`][is] to check if a node matches, and then perform different
operations.

###### Parameters

*   `tree` ([`Node`][node])
    — tree to traverse
*   `visitor` ([`Visitor`][visitor])
    — same as passing `{enter: visitor}`
*   `visitors` ([`Visitors`][visitors])
    — handle each node

###### Returns

Nothing (`void`).

### `CONTINUE`

Continue traversing as normal (`symbol`).

### `EXIT`

Stop traversing immediately (`symbol`).

### `SKIP`

Do not traverse this node’s children (`symbol`).

### `Action`

Union of the action types (TypeScript type).

###### Type

```ts
type Action = typeof CONTINUE | typeof SKIP | typeof EXIT
```

### `ActionTuple`

List with one or two values, the first an action, the second an index
(TypeScript type).

###### Type

```ts
type ActionTuple = [
  (Action | null | undefined | void)?,
  (Index | null | undefined)?
]
```

### `Index`

Move to the sibling at `index` next (after node itself is completely
traversed), when moving in an array (TypeScript type).

Useful if mutating the tree, such as removing the node the visitor is currently
on, or any of its previous siblings.
Results less than 0 or greater than or equal to `children.length` stop
traversing the parent.

###### Type

```ts
type Index = number
```

### `Visitor`

Handle a node (TypeScript type).

Visitors are free to transform `node`.
They can also transform the parent of node (the last of `ancestors`).

Replacing `node` itself, if `SKIP` is not returned, still causes its
descendants to be walked (which is a bug).

When adding or removing previous siblings of `node`, the `Visitor` should
return a new `Index` to specify the sibling to traverse after `node` is
traversed.
Adding or removing next siblings of `node` is handled as expected without
needing to return a new `Index`.

###### Parameters

*   `node` ([`Node`][node])
    — found node
*   `key` (`string` or `null`)
    — field at which `node` lives in its parent (or where a list of nodes
    lives)
*   `index` (`number` or `null`)
    — index where `node` lives if `parent[key]` is an array
*   `ancestors` ([`Array<Node>`][node])
    — ancestors of `node`

###### Returns

What to do next ([`Action`][action], [`Index`][index], or
[`ActionTuple`][actiontuple], optional).

An `Index` is treated as a tuple of `[CONTINUE, Index]`.
An `Action` is treated as a tuple of `[Action]`.

Passing a tuple back only makes sense if the `Action` is `SKIP`.
When the `Action` is `EXIT`, that action can be returned.
When the `Action` is `CONTINUE`, `Index` can be returned.

### `Visitors`

Handle nodes when entering (preorder) and leaving (postorder) (TypeScript
type).

###### Fields

*   `enter` ([`Visitor`][visitor], optional)
    — handle nodes when entering (preorder)
*   `leave` ([`Visitor`][visitor], optional)
    — handle nodes when leaving (postorder)

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`Action`][action],
[`ActionTuple`][actiontuple], [`Index`][index],
[`Visitor`][visitor], and [`Visitors`][visitors].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Related

*   [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit)
    — walk any unist tree

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://github.com/syntax-tree/estree-util-visit/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/estree-util-visit/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/estree-util-visit.svg

[coverage]: https://codecov.io/github/syntax-tree/estree-util-visit

[downloads-badge]: https://img.shields.io/npm/dm/estree-util-visit.svg

[downloads]: https://www.npmjs.com/package/estree-util-visit

[size-badge]: https://img.shields.io/bundlephobia/minzip/estree-util-visit.svg

[size]: https://bundlephobia.com/result?p=estree-util-visit

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

[esast]: https://github.com/syntax-tree/esast

[estree]: https://github.com/estree/estree

[depth-first]: https://github.com/syntax-tree/unist#depth-first-traversal

[tree-traversal]: https://github.com/syntax-tree/unist#tree-traversal

[preorder]: https://github.com/syntax-tree/unist#preorder

[postorder]: https://github.com/syntax-tree/unist#postorder

[is]: https://github.com/syntax-tree/unist-util-is

[node]: https://github.com/syntax-tree/esast#node

[unist-util-visit]: https://github.com/syntax-tree/unist-util-visit

[continue]: #continue

[exit]: #exit

[skip]: #skip

[visit]: #visittree-visitorvisitors

[visitor]: #visitor

[visitors]: #visitors

[action]: #action

[index]: #index

[actiontuple]: #actiontuple
