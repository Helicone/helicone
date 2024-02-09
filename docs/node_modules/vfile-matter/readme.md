# vfile-matter

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

Parse the YAML front matter in a [`vfile`][vfile].

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

[npm][]:

```sh
npm install vfile-matter
```

## Use

Say we have a file, `example.html`:

```html
---
title: Hello, world!
---
<p>Some more text</p>
```

And our script, `example.js`, looks like so:

```js
import {toVFile as vfile} from 'to-vfile'
import {matter} from 'vfile-matter'

var file = vfile.readSync('example.html')

matter(file, {strip: true})

console.log(file.data)
console.log(String(file))
```

Now, running our script (`node example`) yields:

```js
{matter: {title: 'Hello, world!'}}
```

```html
<p>Some more text</p>
```

## API

This package exports the following identifiers: `matter`.
There is no default export.

### `matter(file[, options])`

Parse the YAML front matter in a [`vfile`][vfile], and add it as
`file.data.matter`.

If no matter is found in the file, nothing happens, except that
`file.data.matter` is set to an empty object (`{}`).

###### Parameters

*   `file` ([`VFile`][vfile])
    — Virtual file
*   `options.strip` (`boolean`, default: `false`)
    — Remove the YAML front matter from the file
*   `options.yaml` (`Object`, default: `{}`)
    — Options passed to `jsYaml.load()`

###### Returns

The given `file`.

## Contribute

See [`contributing.md`][contributing] in [`vfile/.github`][health] for ways to
get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/vfile/vfile-matter/workflows/main/badge.svg

[build]: https://github.com/vfile/vfile-matter/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/vfile/vfile-matter.svg

[coverage]: https://codecov.io/github/vfile/vfile-matter

[downloads-badge]: https://img.shields.io/npm/dm/vfile-matter.svg

[downloads]: https://www.npmjs.com/package/vfile-matter

[size-badge]: https://img.shields.io/bundlephobia/minzip/vfile-matter.svg

[size]: https://bundlephobia.com/result?p=vfile-matter

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/vfile/vfile/discussions

[npm]: https://docs.npmjs.com/cli/install

[contributing]: https://github.com/vfile/.github/blob/HEAD/contributing.md

[support]: https://github.com/vfile/.github/blob/HEAD/support.md

[health]: https://github.com/vfile/.github

[coc]: https://github.com/vfile/.github/blob/HEAD/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[vfile]: https://github.com/vfile/vfile
