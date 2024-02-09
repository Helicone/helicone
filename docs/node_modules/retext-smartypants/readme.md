# retext-smartypants

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[retext][]** plugin to apply [SmartyPants][].

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(retextSmartypants[, options])`](#unifieduseretextsmartypants-options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a [unified][] ([retext][]) plugin to apply [SmartyPants][] to
the syntax tree.
It replaces straight/typewriter punctuation marks and symbols with smart/curly
marks and symbols.

## When should I use this?

You can use this plugin any time there straight marks and symbols in prose,
but you want to use smart ones instead.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, or 18.0+), install with [npm][]:

```sh
npm install retext-smartypants
```

In Deno with [`esm.sh`][esmsh]:

```js
import retextSmartypants from 'https://esm.sh/retext-smartypants@5'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import retextSmartypants from 'https://esm.sh/retext-smartypants@5?bundle'
</script>
```

## Use

```js
import {retext} from 'retext'
import retextSmartypants from 'retext-smartypants'

const file = await retext()
  .use(retextSmartypants)
  .process('He said, "A \'simple\' english sentence. . ."')

console.log(String(file))
```

Yields:

```txt
He said, “A ‘simple’ english sentence…”
```

## API

This package exports no identifiers.
The default export is `retextSmartypants`.

### `unified().use(retextSmartypants[, options])`

Apply [SmartyPants][].

##### `options`

Configuration (optional).

###### `options.quotes`

Create smart quotes (`boolean`, default: `true`).

Converts straight double and single quotes to smart double or single quotes.
The options `options.openingQuotes` and `options.closingQuotes` affect which
quotes are considered smart.

###### `options.openingQuotes`

Characters to use for opening quotes `{single: '‘', double: '“'}`.

###### `options.closingQuotes`

Characters to use for closing quotes `{single: '’', double: '”'}`.

###### `options.ellipses`

Create smart ellipses (`boolean`, default: `true`).

Converts triple dot characters (with or without spaces) into a single unicode
ellipsis character.

###### `options.backticks`

Create smart quotes from backticks (`boolean` or `'all'`, default: `true`).

When `true`, converts double backticks into an opening double quote, and
double straight single quotes into a closing double quote.

When `'all'`: does the what `true` does with the addition of converting single
backticks into an opening single quote, and a straight single quote into a
closing single smart quote.

> 👉 **Note**: `options.quotes` can not be `true` when `backticks` is `'all'`.

###### `options.dashes`

Create smart dashes (`boolean` or `'oldschool'`, `'inverted'`, default: `true`).

When `true`, converts two dashes into an em dash character.

When `'oldschool'`, converts two dashes into an en dash, and three dashes into
an em dash.

When `'inverted'`, converts two dashes into an em dash, and three dashes into
an en dash.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Options` and `QuoteCharacterMap`.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Contribute

See [`contributing.md`][contributing] in [`retextjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/retextjs/retext-smartypants/workflows/main/badge.svg

[build]: https://github.com/retextjs/retext-smartypants/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/retextjs/retext-smartypants.svg

[coverage]: https://codecov.io/github/retextjs/retext-smartypants

[downloads-badge]: https://img.shields.io/npm/dm/retext-smartypants.svg

[downloads]: https://www.npmjs.com/package/retext-smartypants

[size-badge]: https://img.shields.io/bundlephobia/minzip/retext-smartypants.svg

[size]: https://bundlephobia.com/result?p=retext-smartypants

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/retextjs/retext/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[health]: https://github.com/retextjs/.github

[contributing]: https://github.com/retextjs/.github/blob/main/contributing.md

[support]: https://github.com/retextjs/.github/blob/main/support.md

[coc]: https://github.com/retextjs/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[retext]: https://github.com/retextjs/retext

[smartypants]: https://daringfireball.net/projects/smartypants
