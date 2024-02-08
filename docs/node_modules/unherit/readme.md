# unherit

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

Create a subclass that can be modified without affecting the super class.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unherit(Super)`](#unheritsuper)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Contribute](#contribute)
*   [Security](#security)
*   [License](#license)

## What is this?

This is a tiny package lets you create a subclass, that can be modified,
without affecting the super class.

## When should I use this?

Not often!
You might have some weird cases though.

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+, 16.0+), install with [npm][]:

```sh
npm install unherit
```

In Deno with [`esm.sh`][esmsh]:

```js
import {unherit} from 'https://esm.sh/unherit@3'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {unherit} from 'https://esm.sh/unherit@3?bundle'
</script>
```

## Use

```js
import {EventEmitter} from 'node:events'
import {unherit} from 'unherit'

// Create a private class which acts just like `EventEmitter`.
const Emitter = unherit(EventEmitter)

Emitter.prototype.defaultMaxListeners = 0
// Now, all instances of `Emitter` have `0` maximum listeners, without affecting
// other `EventEmitter`s.

new Emitter().defaultMaxListeners === 0 // => true
new EventEmitter().defaultMaxListeners === undefined // => true
new Emitter() instanceof EventEmitter // => true
```

## API

This package exports the identifier `unherit`.
There is no default export.

### `unherit(Super)`

Subclass `Super`.

## Types

This package is fully typed with [TypeScript][].
It exports no additional types.

## Compatibility

This package is at least compatible with all maintained versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
It also works in Deno and modern browsers.

## Contribute

Yes please!
See [How to Contribute to Open Source][contribute].

## Security

This package is safe.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/wooorm/unherit/workflows/main/badge.svg

[build]: https://github.com/wooorm/unherit/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/unherit.svg

[coverage]: https://codecov.io/github/wooorm/unherit

[downloads-badge]: https://img.shields.io/npm/dm/unherit.svg

[downloads]: https://www.npmjs.com/package/unherit

[size-badge]: https://img.shields.io/bundlephobia/minzip/unherit.svg

[size]: https://bundlephobia.com/result?p=unherit

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[contribute]: https://opensource.guide/how-to-contribute/

[license]: license

[author]: https://wooorm.com
