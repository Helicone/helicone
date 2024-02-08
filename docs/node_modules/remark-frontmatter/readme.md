# remark-frontmatter

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**remark**][remark] plugin to support frontmatter (YAML, TOML, and more).

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(remarkFrontmatter[, options])`](#unifieduseremarkfrontmatter-options)
*   [Examples](#examples)
    *   [Example: custom marker](#example-custom-marker)
    *   [Example: custom fence](#example-custom-fence)
*   [Syntax](#syntax)
*   [Syntax tree](#syntax-tree)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a [unified][] ([remark][]) plugin to add support for YAML, TOML,
and other frontmatter.
You can use this to add support for parsing and serializing this syntax
extension.

unified is an AST (abstract syntax tree) based transform project.
**remark** is everything unified that relates to markdown.
The layer under remark is called mdast, which is only concerned with syntax
trees.
Another layer underneath is micromark, which is only concerned with parsing.
This package is a small wrapper to integrate all of these.

## When should I use this?

Frontmatter is a metadata format in front of content.
It’s typically written in YAML and is often used with markdown.
This mechanism works well when you want authors, that have some markup
experience, to configure where or how the content is displayed or supply
metadata about content.
Frontmatter does not work everywhere so it makes markdown less portable.
A good example use case is markdown being rendered by (static) site generators.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).
In Node.js (12.20+, 14.14+, 16.0+), install with [npm][]:

```sh
npm install remark-frontmatter
```

In Deno with [Skypack][]:

```js
import remarkFrontmatter from 'https://cdn.skypack.dev/remark-frontmatter@4?dts'
```

In browsers with [Skypack][]:

```html
<script type="module">
  import remarkFrontmatter from 'https://cdn.skypack.dev/remark-frontmatter@4?min'
</script>
```

## Use

Say we have the following file, `example.md`:

```markdown
+++
title = "New Website"
+++

# Other markdown
```

And our module, `example.js`, looks as follows:

```js
import {read} from 'to-vfile'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkStringify from 'remark-stringify'

main()

async function main() {
  const file = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(() => (tree) => {
      console.dir(tree)
    })
    .process(await read('example.md'))

  console.log(String(file))
}
```

Now, running `node example` yields:

```js
{
  type: 'root',
  children: [
    {type: 'toml', value: 'title = "New Website"', position: [Object]},
    {type: 'heading', depth: 1, children: [Array], position: [Object]}
  ],
  position: {
    start: {line: 1, column: 1, offset: 0},
    end: {line: 6, column: 1, offset: 48}
  }
}
```

```markdown
+++
title = "New Website"
+++

# Other markdown
```

## API

This package exports no identifiers.
The default export is `remarkFrontmatter`.

### `unified().use(remarkFrontmatter[, options])`

Configures remark so that it can parse and serialize frontmatter (YAML, TOML,
and more).
Doesn’t parse the data inside them: [create your own plugin][create-plugin] to
do that.

##### `options`

One `preset` or `Matter`, or an array of them, defining all the supported
frontmatters (default: `'yaml'`).

##### `preset`

Either `'yaml'` or `'toml'`:

*   `'yaml'` — `Matter` defined as `{type: 'yaml', marker: '-'}`
*   `'toml'` — `Matter` defined as `{type: 'toml', marker: '+'}`

##### `Matter`

An object with a `type` and either a `marker` or a `fence`:

*   `type` (`string`)
    — Type to tokenize as
*   `marker` (`string` or `{open: string, close: string}`)
    — Character used to construct fences.
    By providing an object with `open` and `close` different characters can be
    used for opening and closing fences.
    For example the character `'-'` will result in `'---'` being used as the
    fence
*   `fence` (`string` or `{open: string, close: string}`)
    — String used as the complete fence.
    By providing an object with `open` and `close` different values can be used
    for opening and closing fences.
    This can be used too if fences contain different characters or lengths other
    than 3
*   `anywhere` (`boolean`, default: `false`)
    – if `true`, matter can be found anywhere in the document.
    If `false` (default), only matter at the start of the document is recognized

## Examples

### Example: custom marker

A custom frontmatter with different open and close markers, repeated 3 times,
that looks like this:

```text
<<<
data
>>>

# hi
```

…can be supported with:

```js
// …
.use(remarkFrontmatter, {type: 'custom', marker: {open: '<', close: '>'}})
// …
```

### Example: custom fence

A custom frontmatter with custom fences that are not repeated like this:

```text
{
  "key": "value"
}

# hi
```

…can be supported with:

```js
// …
.use(remarkFrontmatter, {type: 'json', fence: {open: '{', close: '}'}})
// …
```

## Syntax

This plugin applies a micromark extensions to parse the syntax.
See its readme for how it works:

*   [`micromark-extension-frontmatter`](https://github.com/micromark/micromark-extension-frontmatter)

The syntax supported depends on the given configuration.

## Syntax tree

This plugin applies one mdast utility to build and serialize the AST.
See its readme for how it works:

*   [`mdast-util-frontmatter`](https://github.com/syntax-tree/mdast-util-directive)

The node types supported in the tree depend on the given configuration.

## Types

This package is fully typed with [TypeScript][].
The YAML node type is supported in `@types/mdast` by default.
To add other node types, register them by adding them to
`FrontmatterContentMap`:

```ts
import type {Literal} from 'mdast'

interface TOML extends Literal {
  type: 'toml'
}

declare module 'mdast' {
  interface FrontmatterContentMap {
    // Allow using toml nodes defined by `remark-frontmatter`.
    toml: TOML
  }
}
```

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

This plugin works with unified 6+ and remark 13+.

## Security

Use of `remark-frontmatter` does not involve [**rehype**][rehype]
([**hast**][hast]) or user content so there are no openings for
[cross-site scripting (XSS)][xss] attacks.

## Related

*   [`remark-yaml-config`](https://github.com/remarkjs/remark-yaml-config)
    — configure remark from YAML configuration
*   [`remark-gfm`](https://github.com/remarkjs/remark-gfm)
    — support GFM (autolink literals, strikethrough, tables, tasklists)
*   [`remark-github`](https://github.com/remarkjs/remark-github)
    — link references to commits, issues, pull-requests, and users, like on
    GitHub
*   [`remark-directive`](https://github.com/remarkjs/remark-directive)
    — support directives
*   [`remark-math`](https://github.com/remarkjs/remark-math)
    — support math

## Contribute

See [`contributing.md`][contributing] in [`remarkjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/remarkjs/remark-frontmatter/workflows/main/badge.svg

[build]: https://github.com/remarkjs/remark-frontmatter/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-frontmatter.svg

[coverage]: https://codecov.io/github/remarkjs/remark-frontmatter

[downloads-badge]: https://img.shields.io/npm/dm/remark-frontmatter.svg

[downloads]: https://www.npmjs.com/package/remark-frontmatter

[size-badge]: https://img.shields.io/bundlephobia/minzip/remark-frontmatter.svg

[size]: https://bundlephobia.com/result?p=remark-frontmatter

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/remarkjs/remark/discussions

[npm]: https://docs.npmjs.com/cli/install

[skypack]: https://www.skypack.dev

[health]: https://github.com/remarkjs/.github

[contributing]: https://github.com/remarkjs/.github/blob/HEAD/contributing.md

[support]: https://github.com/remarkjs/.github/blob/HEAD/support.md

[coc]: https://github.com/remarkjs/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[remark]: https://github.com/remarkjs/remark

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[typescript]: https://www.typescriptlang.org

[rehype]: https://github.com/rehypejs/rehype

[hast]: https://github.com/syntax-tree/hast

[create-plugin]: https://unifiedjs.com/learn/guide/create-a-plugin/
