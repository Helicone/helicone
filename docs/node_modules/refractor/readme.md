<!--lint disable no-html-->

# refractor

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]

Lightweight, robust, elegant virtual syntax highlighting using [Prism][].

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Playground](#playground)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`refractor.highlight(value, language)`](#refractorhighlightvalue-language)
    *   [`refractor.register(syntax)`](#refractorregistersyntax)
    *   [`refractor.alias(name[, alias])`](#refractoraliasname-alias)
    *   [`refractor.registered(aliasOrlanguage)`](#refractorregisteredaliasorlanguage)
    *   [`refractor.listLanguages()`](#refractorlistlanguages)
*   [Examples](#examples)
    *   [Example: serializing hast as html](#example-serializing-hast-as-html)
    *   [Example: turning hast into react nodes](#example-turning-hast-into-react-nodes)
*   [Types](#types)
*   [Data](#data)
*   [CSS](#css)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Projects](#projects)
*   [Contribute](#contribute)

## What is this?

This package wraps [Prism][] to output objects (ASTs) instead of a string of
HTML.

Prism, through refractor, supports 270+ programming languages.
Supporting all of them requires a lot of code.
That’s why there are three entry points for refractor:

<!--count start-->

*   `lib/core.js` — 0 languages
*   `lib/common.js` (default) — 36 languages
*   `lib/all.js` — 297 languages

<!--count end-->

Bundled, minified, and gzipped, those are roughly 12.7 kB, 40 kB, and 211 kB.

## When should I use this?

This package is useful when you want to perform syntax highlighting in a place
where serialized HTML wouldn’t work or wouldn’t work well.
For example, you can use refractor when you want to show code in a CLI by
rendering to ANSI sequences, when you’re using virtual DOM frameworks (such as
React or Preact) so that diffing can be performant, or when you’re working with
ASTs (rehype).

A different package, [`lowlight`][lowlight], does the same as refractor but
uses [`highlight.js`][hljs] instead.
If you’re looking for a *really good* (but rather heavy) highlighter, try
[`starry-night`][starry-night].

<!--Old name of the following section:-->

<a name="demo"></a>

## Playground

You can play with refractor on the
[interactive demo (Replit)](https://replit.com/@karlhorky/official-refractor-demo#index.js).

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+, 16.0+), install with [npm][]:

```sh
npm install refractor
```

In Deno with [`esm.sh`][esmsh]:

```js
import {refractor} from 'https://esm.sh/refractor@4'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {refractor} from 'https://esm.sh/refractor@4?bundle'
</script>
```

## Use

```js
import {refractor} from 'refractor'

const tree = refractor.highlight('"use strict";', 'js')

console.log(tree)
```

Yields:

```js
{
  type: 'root',
  children: [
    {
      type: 'element',
      tagName: 'span',
      properties: {className: ['token', 'string']},
      children: [{type: 'text', value: '"use strict"'}]
    },
    {
      type: 'element',
      tagName: 'span',
      properties: {className: ['token', 'punctuation']},
      children: [{type: 'text', value: ';'}]
    }
  ]
}
```

## API

This package exports the identifier `refractor`.
There is no default export.

### `refractor.highlight(value, language)`

Highlight `value` (code) as `language` (programming language).

###### Parameters

*   `value` (`string`)
    — code to highlight
*   `language` (`string` or `Grammar`)
    — programming language name, alias, or grammar.

###### Returns

Node representing highlighted code ([`Root`][root]).

###### Example

```js
import {refractor} from 'refractor/lib/core.js'
import css from 'refractor/lang/css.js'

refractor.register(css)
console.log(refractor.highlight('em { color: red }', 'css'))
```

Yields:

```js
{
  type: 'root',
  children: [
    {type: 'element', tagName: 'span', properties: [Object], children: [Array]},
    {type: 'text', value: ' '},
    // …
    {type: 'text', value: ' red '},
    {type: 'element', tagName: 'span', properties: [Object], children: [Array]}
  ]
}
```

### `refractor.register(syntax)`

Register a syntax.

###### Parameters

*   `syntax` (`Function`)
    — language function custom made for refractor, as in, the files in
    `refractor/lang/*.js`

###### Example

```js
import {refractor} from 'refractor/lib/core.js'
import markdown from 'refractor/lang/markdown.js'

refractor.register(markdown)

console.log(refractor.highlight('*Emphasis*', 'markdown'))
```

Yields:

```js
{
  type: 'root',
  children: [
    {type: 'element', tagName: 'span', properties: [Object], children: [Array]}
  ]
}
```

### `refractor.alias(name[, alias])`

Register aliases for already registered languages.

###### Signatures

*   `alias(name, alias|list)`
*   `alias(aliases)`

###### Parameters

*   `language` (`string`)
    — programming language [name][names]
*   `alias` (`string`)
    — new aliases for the programming language
*   `list` (`Array<string>`)
    — list of aliases
*   `aliases` (`Record<language, alias|list>`)
    — map of `language`s to `alias`es or `list`s

###### Example

```js
import {refractor} from 'refractor/lib/core.js'
import markdown from 'refractor/lang/markdown.js'

refractor.register(markdown)

// refractor.highlight('*Emphasis*', 'mdown')
// ^ would throw: Error: Unknown language: `mdown` is not registered

refractor.alias({markdown: ['mdown', 'mkdn', 'mdwn', 'ron']})
refractor.highlight('*Emphasis*', 'mdown')
// ^ Works!
```

### `refractor.registered(aliasOrlanguage)`

Check whether an `alias` or `language` is registered.

###### Parameters

*   `aliasOrlanguage` (`string`)
    — programming language name or alias

###### Example

```js
import {refractor} from 'refractor/lib/core.js'
import markdown from 'refractor/lang/markdown.js'

console.log(refractor.registered('markdown')) //=> false

refractor.register(markdown)

console.log(refractor.registered('markdown')) //=> true
```

### `refractor.listLanguages()`

List all registered languages (names and aliases).

###### Returns

`Array<string>`.

###### Example

```js
import {refractor} from 'refractor/lib/core.js'
import markdown from 'refractor/lang/markdown.js'

console.log(refractor.listLanguages()) //=> []

refractor.register(markdown)

console.log(refractor.listLanguages())
```

Yields:

```js
[
  'markup', // Note that `markup` (a lot of xml based languages) is a dep of markdown.
  'html',
  // …
  'markdown',
  'md'
]
```

## Examples

### Example: serializing hast as html

hast trees as returned by refractor can be serialized with
[`hast-util-to-html`][hast-util-to-html]:

```js
import {refractor} from 'refractor'
import {toHtml} from 'hast-util-to-html'

const tree = refractor.highlight('"use strict";', 'js')

console.log(toHtml(tree))
```

Yields:

```html
<span class="token string">"use strict"</span><span class="token punctuation">;</span>
```

### Example: turning hast into react nodes

hast trees as returned by refractor can be turned into React (or Preact) with
[`hast-to-hyperscript`][hast-to-hyperscript]:

```js
import {refractor} from 'refractor'
import {toH} from 'hast-to-hyperscript'
import React from 'react'

const tree = refractor.highlight('"use strict";', 'js')
const react = toH(React.createElement, tree)

console.log(react)
```

Yields:

```js
{
  '$$typeof': Symbol(react.element),
  type: 'div',
  key: 'h-1',
  ref: null,
  props: { children: [ [Object], [Object] ] },
  _owner: null,
  _store: {}
}
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Root`, `Grammar`, and `Syntax`.

<!--Old name of the following section:-->

<a name="syntaxes"></a>

## Data

If you’re using `refractor/lib/core.js`, no syntaxes are included.
Checked syntaxes are included if you import `refractor` (or explicitly
`refractor/lib/common.js`).
Unchecked syntaxes are available through `refractor/lib/all.js`.
You can import `core` or `common` and manually add more languages as you please.

Prism operates as a singleton: once you register a language in one place, it’ll
be available everywhere.

Only these custom built syntaxes will work with `refractor` because Prism’s own
syntaxes are made to work with global variables and are not importable.

<!--support start-->

*   [x] [`arduino`](https://github.com/wooorm/refractor/blob/main/lang/arduino.js) — alias: `ino`
*   [x] [`bash`](https://github.com/wooorm/refractor/blob/main/lang/bash.js) — alias: `sh`, `shell`
*   [x] [`basic`](https://github.com/wooorm/refractor/blob/main/lang/basic.js)
*   [x] [`c`](https://github.com/wooorm/refractor/blob/main/lang/c.js)
*   [x] [`clike`](https://github.com/wooorm/refractor/blob/main/lang/clike.js)
*   [x] [`cpp`](https://github.com/wooorm/refractor/blob/main/lang/cpp.js)
*   [x] [`csharp`](https://github.com/wooorm/refractor/blob/main/lang/csharp.js) — alias: `cs`, `dotnet`
*   [x] [`css`](https://github.com/wooorm/refractor/blob/main/lang/css.js)
*   [x] [`diff`](https://github.com/wooorm/refractor/blob/main/lang/diff.js)
*   [x] [`go`](https://github.com/wooorm/refractor/blob/main/lang/go.js)
*   [x] [`ini`](https://github.com/wooorm/refractor/blob/main/lang/ini.js)
*   [x] [`java`](https://github.com/wooorm/refractor/blob/main/lang/java.js)
*   [x] [`javascript`](https://github.com/wooorm/refractor/blob/main/lang/javascript.js) — alias: `js`
*   [x] [`json`](https://github.com/wooorm/refractor/blob/main/lang/json.js) — alias: `webmanifest`
*   [x] [`kotlin`](https://github.com/wooorm/refractor/blob/main/lang/kotlin.js) — alias: `kt`, `kts`
*   [x] [`less`](https://github.com/wooorm/refractor/blob/main/lang/less.js)
*   [x] [`lua`](https://github.com/wooorm/refractor/blob/main/lang/lua.js)
*   [x] [`makefile`](https://github.com/wooorm/refractor/blob/main/lang/makefile.js)
*   [x] [`markdown`](https://github.com/wooorm/refractor/blob/main/lang/markdown.js) — alias: `md`
*   [x] [`markup`](https://github.com/wooorm/refractor/blob/main/lang/markup.js) — alias: `atom`, `html`, `mathml`, `rss`, `ssml`, `svg`, `xml`
*   [x] [`markup-templating`](https://github.com/wooorm/refractor/blob/main/lang/markup-templating.js)
*   [x] [`objectivec`](https://github.com/wooorm/refractor/blob/main/lang/objectivec.js) — alias: `objc`
*   [x] [`perl`](https://github.com/wooorm/refractor/blob/main/lang/perl.js)
*   [x] [`php`](https://github.com/wooorm/refractor/blob/main/lang/php.js)
*   [x] [`python`](https://github.com/wooorm/refractor/blob/main/lang/python.js) — alias: `py`
*   [x] [`r`](https://github.com/wooorm/refractor/blob/main/lang/r.js)
*   [x] [`regex`](https://github.com/wooorm/refractor/blob/main/lang/regex.js)
*   [x] [`ruby`](https://github.com/wooorm/refractor/blob/main/lang/ruby.js) — alias: `rb`
*   [x] [`rust`](https://github.com/wooorm/refractor/blob/main/lang/rust.js)
*   [x] [`sass`](https://github.com/wooorm/refractor/blob/main/lang/sass.js)
*   [x] [`scss`](https://github.com/wooorm/refractor/blob/main/lang/scss.js)
*   [x] [`sql`](https://github.com/wooorm/refractor/blob/main/lang/sql.js)
*   [x] [`swift`](https://github.com/wooorm/refractor/blob/main/lang/swift.js)
*   [x] [`typescript`](https://github.com/wooorm/refractor/blob/main/lang/typescript.js) — alias: `ts`
*   [x] [`vbnet`](https://github.com/wooorm/refractor/blob/main/lang/vbnet.js)
*   [x] [`yaml`](https://github.com/wooorm/refractor/blob/main/lang/yaml.js) — alias: `yml`
*   [ ] [`abap`](https://github.com/wooorm/refractor/blob/main/lang/abap.js)
*   [ ] [`abnf`](https://github.com/wooorm/refractor/blob/main/lang/abnf.js)
*   [ ] [`actionscript`](https://github.com/wooorm/refractor/blob/main/lang/actionscript.js)
*   [ ] [`ada`](https://github.com/wooorm/refractor/blob/main/lang/ada.js)
*   [ ] [`agda`](https://github.com/wooorm/refractor/blob/main/lang/agda.js)
*   [ ] [`al`](https://github.com/wooorm/refractor/blob/main/lang/al.js)
*   [ ] [`antlr4`](https://github.com/wooorm/refractor/blob/main/lang/antlr4.js) — alias: `g4`
*   [ ] [`apacheconf`](https://github.com/wooorm/refractor/blob/main/lang/apacheconf.js)
*   [ ] [`apex`](https://github.com/wooorm/refractor/blob/main/lang/apex.js)
*   [ ] [`apl`](https://github.com/wooorm/refractor/blob/main/lang/apl.js)
*   [ ] [`applescript`](https://github.com/wooorm/refractor/blob/main/lang/applescript.js)
*   [ ] [`aql`](https://github.com/wooorm/refractor/blob/main/lang/aql.js)
*   [ ] [`arff`](https://github.com/wooorm/refractor/blob/main/lang/arff.js)
*   [ ] [`armasm`](https://github.com/wooorm/refractor/blob/main/lang/armasm.js) — alias: `arm-asm`
*   [ ] [`arturo`](https://github.com/wooorm/refractor/blob/main/lang/arturo.js) — alias: `art`
*   [ ] [`asciidoc`](https://github.com/wooorm/refractor/blob/main/lang/asciidoc.js) — alias: `adoc`
*   [ ] [`asm6502`](https://github.com/wooorm/refractor/blob/main/lang/asm6502.js)
*   [ ] [`asmatmel`](https://github.com/wooorm/refractor/blob/main/lang/asmatmel.js)
*   [ ] [`aspnet`](https://github.com/wooorm/refractor/blob/main/lang/aspnet.js)
*   [ ] [`autohotkey`](https://github.com/wooorm/refractor/blob/main/lang/autohotkey.js)
*   [ ] [`autoit`](https://github.com/wooorm/refractor/blob/main/lang/autoit.js)
*   [ ] [`avisynth`](https://github.com/wooorm/refractor/blob/main/lang/avisynth.js) — alias: `avs`
*   [ ] [`avro-idl`](https://github.com/wooorm/refractor/blob/main/lang/avro-idl.js) — alias: `avdl`
*   [ ] [`awk`](https://github.com/wooorm/refractor/blob/main/lang/awk.js) — alias: `gawk`
*   [ ] [`batch`](https://github.com/wooorm/refractor/blob/main/lang/batch.js)
*   [ ] [`bbcode`](https://github.com/wooorm/refractor/blob/main/lang/bbcode.js) — alias: `shortcode`
*   [ ] [`bbj`](https://github.com/wooorm/refractor/blob/main/lang/bbj.js)
*   [ ] [`bicep`](https://github.com/wooorm/refractor/blob/main/lang/bicep.js)
*   [ ] [`birb`](https://github.com/wooorm/refractor/blob/main/lang/birb.js)
*   [ ] [`bison`](https://github.com/wooorm/refractor/blob/main/lang/bison.js)
*   [ ] [`bnf`](https://github.com/wooorm/refractor/blob/main/lang/bnf.js) — alias: `rbnf`
*   [ ] [`bqn`](https://github.com/wooorm/refractor/blob/main/lang/bqn.js)
*   [ ] [`brainfuck`](https://github.com/wooorm/refractor/blob/main/lang/brainfuck.js)
*   [ ] [`brightscript`](https://github.com/wooorm/refractor/blob/main/lang/brightscript.js)
*   [ ] [`bro`](https://github.com/wooorm/refractor/blob/main/lang/bro.js)
*   [ ] [`bsl`](https://github.com/wooorm/refractor/blob/main/lang/bsl.js) — alias: `oscript`
*   [ ] [`cfscript`](https://github.com/wooorm/refractor/blob/main/lang/cfscript.js) — alias: `cfc`
*   [ ] [`chaiscript`](https://github.com/wooorm/refractor/blob/main/lang/chaiscript.js)
*   [ ] [`cil`](https://github.com/wooorm/refractor/blob/main/lang/cil.js)
*   [ ] [`cilkc`](https://github.com/wooorm/refractor/blob/main/lang/cilkc.js) — alias: `cilk-c`
*   [ ] [`cilkcpp`](https://github.com/wooorm/refractor/blob/main/lang/cilkcpp.js) — alias: `cilk`, `cilk-cpp`
*   [ ] [`clojure`](https://github.com/wooorm/refractor/blob/main/lang/clojure.js)
*   [ ] [`cmake`](https://github.com/wooorm/refractor/blob/main/lang/cmake.js)
*   [ ] [`cobol`](https://github.com/wooorm/refractor/blob/main/lang/cobol.js)
*   [ ] [`coffeescript`](https://github.com/wooorm/refractor/blob/main/lang/coffeescript.js) — alias: `coffee`
*   [ ] [`concurnas`](https://github.com/wooorm/refractor/blob/main/lang/concurnas.js) — alias: `conc`
*   [ ] [`cooklang`](https://github.com/wooorm/refractor/blob/main/lang/cooklang.js)
*   [ ] [`coq`](https://github.com/wooorm/refractor/blob/main/lang/coq.js)
*   [ ] [`crystal`](https://github.com/wooorm/refractor/blob/main/lang/crystal.js)
*   [ ] [`cshtml`](https://github.com/wooorm/refractor/blob/main/lang/cshtml.js) — alias: `razor`
*   [ ] [`csp`](https://github.com/wooorm/refractor/blob/main/lang/csp.js)
*   [ ] [`css-extras`](https://github.com/wooorm/refractor/blob/main/lang/css-extras.js)
*   [ ] [`csv`](https://github.com/wooorm/refractor/blob/main/lang/csv.js)
*   [ ] [`cue`](https://github.com/wooorm/refractor/blob/main/lang/cue.js)
*   [ ] [`cypher`](https://github.com/wooorm/refractor/blob/main/lang/cypher.js)
*   [ ] [`d`](https://github.com/wooorm/refractor/blob/main/lang/d.js)
*   [ ] [`dart`](https://github.com/wooorm/refractor/blob/main/lang/dart.js)
*   [ ] [`dataweave`](https://github.com/wooorm/refractor/blob/main/lang/dataweave.js)
*   [ ] [`dax`](https://github.com/wooorm/refractor/blob/main/lang/dax.js)
*   [ ] [`dhall`](https://github.com/wooorm/refractor/blob/main/lang/dhall.js)
*   [ ] [`django`](https://github.com/wooorm/refractor/blob/main/lang/django.js) — alias: `jinja2`
*   [ ] [`dns-zone-file`](https://github.com/wooorm/refractor/blob/main/lang/dns-zone-file.js) — alias: `dns-zone`
*   [ ] [`docker`](https://github.com/wooorm/refractor/blob/main/lang/docker.js) — alias: `dockerfile`
*   [ ] [`dot`](https://github.com/wooorm/refractor/blob/main/lang/dot.js) — alias: `gv`
*   [ ] [`ebnf`](https://github.com/wooorm/refractor/blob/main/lang/ebnf.js)
*   [ ] [`editorconfig`](https://github.com/wooorm/refractor/blob/main/lang/editorconfig.js)
*   [ ] [`eiffel`](https://github.com/wooorm/refractor/blob/main/lang/eiffel.js)
*   [ ] [`ejs`](https://github.com/wooorm/refractor/blob/main/lang/ejs.js) — alias: `eta`
*   [ ] [`elixir`](https://github.com/wooorm/refractor/blob/main/lang/elixir.js)
*   [ ] [`elm`](https://github.com/wooorm/refractor/blob/main/lang/elm.js)
*   [ ] [`erb`](https://github.com/wooorm/refractor/blob/main/lang/erb.js)
*   [ ] [`erlang`](https://github.com/wooorm/refractor/blob/main/lang/erlang.js)
*   [ ] [`etlua`](https://github.com/wooorm/refractor/blob/main/lang/etlua.js)
*   [ ] [`excel-formula`](https://github.com/wooorm/refractor/blob/main/lang/excel-formula.js) — alias: `xls`, `xlsx`
*   [ ] [`factor`](https://github.com/wooorm/refractor/blob/main/lang/factor.js)
*   [ ] [`false`](https://github.com/wooorm/refractor/blob/main/lang/false.js)
*   [ ] [`firestore-security-rules`](https://github.com/wooorm/refractor/blob/main/lang/firestore-security-rules.js)
*   [ ] [`flow`](https://github.com/wooorm/refractor/blob/main/lang/flow.js)
*   [ ] [`fortran`](https://github.com/wooorm/refractor/blob/main/lang/fortran.js)
*   [ ] [`fsharp`](https://github.com/wooorm/refractor/blob/main/lang/fsharp.js)
*   [ ] [`ftl`](https://github.com/wooorm/refractor/blob/main/lang/ftl.js)
*   [ ] [`gap`](https://github.com/wooorm/refractor/blob/main/lang/gap.js)
*   [ ] [`gcode`](https://github.com/wooorm/refractor/blob/main/lang/gcode.js)
*   [ ] [`gdscript`](https://github.com/wooorm/refractor/blob/main/lang/gdscript.js)
*   [ ] [`gedcom`](https://github.com/wooorm/refractor/blob/main/lang/gedcom.js)
*   [ ] [`gettext`](https://github.com/wooorm/refractor/blob/main/lang/gettext.js) — alias: `po`
*   [ ] [`gherkin`](https://github.com/wooorm/refractor/blob/main/lang/gherkin.js)
*   [ ] [`git`](https://github.com/wooorm/refractor/blob/main/lang/git.js)
*   [ ] [`glsl`](https://github.com/wooorm/refractor/blob/main/lang/glsl.js)
*   [ ] [`gml`](https://github.com/wooorm/refractor/blob/main/lang/gml.js) — alias: `gamemakerlanguage`
*   [ ] [`gn`](https://github.com/wooorm/refractor/blob/main/lang/gn.js) — alias: `gni`
*   [ ] [`go-module`](https://github.com/wooorm/refractor/blob/main/lang/go-module.js) — alias: `go-mod`
*   [ ] [`gradle`](https://github.com/wooorm/refractor/blob/main/lang/gradle.js)
*   [ ] [`graphql`](https://github.com/wooorm/refractor/blob/main/lang/graphql.js)
*   [ ] [`groovy`](https://github.com/wooorm/refractor/blob/main/lang/groovy.js)
*   [ ] [`haml`](https://github.com/wooorm/refractor/blob/main/lang/haml.js)
*   [ ] [`handlebars`](https://github.com/wooorm/refractor/blob/main/lang/handlebars.js) — alias: `hbs`, `mustache`
*   [ ] [`haskell`](https://github.com/wooorm/refractor/blob/main/lang/haskell.js) — alias: `hs`
*   [ ] [`haxe`](https://github.com/wooorm/refractor/blob/main/lang/haxe.js)
*   [ ] [`hcl`](https://github.com/wooorm/refractor/blob/main/lang/hcl.js)
*   [ ] [`hlsl`](https://github.com/wooorm/refractor/blob/main/lang/hlsl.js)
*   [ ] [`hoon`](https://github.com/wooorm/refractor/blob/main/lang/hoon.js)
*   [ ] [`hpkp`](https://github.com/wooorm/refractor/blob/main/lang/hpkp.js)
*   [ ] [`hsts`](https://github.com/wooorm/refractor/blob/main/lang/hsts.js)
*   [ ] [`http`](https://github.com/wooorm/refractor/blob/main/lang/http.js)
*   [ ] [`ichigojam`](https://github.com/wooorm/refractor/blob/main/lang/ichigojam.js)
*   [ ] [`icon`](https://github.com/wooorm/refractor/blob/main/lang/icon.js)
*   [ ] [`icu-message-format`](https://github.com/wooorm/refractor/blob/main/lang/icu-message-format.js)
*   [ ] [`idris`](https://github.com/wooorm/refractor/blob/main/lang/idris.js) — alias: `idr`
*   [ ] [`iecst`](https://github.com/wooorm/refractor/blob/main/lang/iecst.js)
*   [ ] [`ignore`](https://github.com/wooorm/refractor/blob/main/lang/ignore.js) — alias: `gitignore`, `hgignore`, `npmignore`
*   [ ] [`inform7`](https://github.com/wooorm/refractor/blob/main/lang/inform7.js)
*   [ ] [`io`](https://github.com/wooorm/refractor/blob/main/lang/io.js)
*   [ ] [`j`](https://github.com/wooorm/refractor/blob/main/lang/j.js)
*   [ ] [`javadoc`](https://github.com/wooorm/refractor/blob/main/lang/javadoc.js)
*   [ ] [`javadoclike`](https://github.com/wooorm/refractor/blob/main/lang/javadoclike.js)
*   [ ] [`javastacktrace`](https://github.com/wooorm/refractor/blob/main/lang/javastacktrace.js)
*   [ ] [`jexl`](https://github.com/wooorm/refractor/blob/main/lang/jexl.js)
*   [ ] [`jolie`](https://github.com/wooorm/refractor/blob/main/lang/jolie.js)
*   [ ] [`jq`](https://github.com/wooorm/refractor/blob/main/lang/jq.js)
*   [ ] [`js-extras`](https://github.com/wooorm/refractor/blob/main/lang/js-extras.js)
*   [ ] [`js-templates`](https://github.com/wooorm/refractor/blob/main/lang/js-templates.js)
*   [ ] [`jsdoc`](https://github.com/wooorm/refractor/blob/main/lang/jsdoc.js)
*   [ ] [`json5`](https://github.com/wooorm/refractor/blob/main/lang/json5.js)
*   [ ] [`jsonp`](https://github.com/wooorm/refractor/blob/main/lang/jsonp.js)
*   [ ] [`jsstacktrace`](https://github.com/wooorm/refractor/blob/main/lang/jsstacktrace.js)
*   [ ] [`jsx`](https://github.com/wooorm/refractor/blob/main/lang/jsx.js)
*   [ ] [`julia`](https://github.com/wooorm/refractor/blob/main/lang/julia.js)
*   [ ] [`keepalived`](https://github.com/wooorm/refractor/blob/main/lang/keepalived.js)
*   [ ] [`keyman`](https://github.com/wooorm/refractor/blob/main/lang/keyman.js)
*   [ ] [`kumir`](https://github.com/wooorm/refractor/blob/main/lang/kumir.js) — alias: `kum`
*   [ ] [`kusto`](https://github.com/wooorm/refractor/blob/main/lang/kusto.js)
*   [ ] [`latex`](https://github.com/wooorm/refractor/blob/main/lang/latex.js) — alias: `context`, `tex`
*   [ ] [`latte`](https://github.com/wooorm/refractor/blob/main/lang/latte.js)
*   [ ] [`lilypond`](https://github.com/wooorm/refractor/blob/main/lang/lilypond.js) — alias: `ly`
*   [ ] [`linker-script`](https://github.com/wooorm/refractor/blob/main/lang/linker-script.js) — alias: `ld`
*   [ ] [`liquid`](https://github.com/wooorm/refractor/blob/main/lang/liquid.js)
*   [ ] [`lisp`](https://github.com/wooorm/refractor/blob/main/lang/lisp.js) — alias: `elisp`, `emacs`, `emacs-lisp`
*   [ ] [`livescript`](https://github.com/wooorm/refractor/blob/main/lang/livescript.js)
*   [ ] [`llvm`](https://github.com/wooorm/refractor/blob/main/lang/llvm.js)
*   [ ] [`log`](https://github.com/wooorm/refractor/blob/main/lang/log.js)
*   [ ] [`lolcode`](https://github.com/wooorm/refractor/blob/main/lang/lolcode.js)
*   [ ] [`magma`](https://github.com/wooorm/refractor/blob/main/lang/magma.js)
*   [ ] [`mata`](https://github.com/wooorm/refractor/blob/main/lang/mata.js)
*   [ ] [`matlab`](https://github.com/wooorm/refractor/blob/main/lang/matlab.js)
*   [ ] [`maxscript`](https://github.com/wooorm/refractor/blob/main/lang/maxscript.js)
*   [ ] [`mel`](https://github.com/wooorm/refractor/blob/main/lang/mel.js)
*   [ ] [`mermaid`](https://github.com/wooorm/refractor/blob/main/lang/mermaid.js)
*   [ ] [`metafont`](https://github.com/wooorm/refractor/blob/main/lang/metafont.js)
*   [ ] [`mizar`](https://github.com/wooorm/refractor/blob/main/lang/mizar.js)
*   [ ] [`mongodb`](https://github.com/wooorm/refractor/blob/main/lang/mongodb.js)
*   [ ] [`monkey`](https://github.com/wooorm/refractor/blob/main/lang/monkey.js)
*   [ ] [`moonscript`](https://github.com/wooorm/refractor/blob/main/lang/moonscript.js) — alias: `moon`
*   [ ] [`n1ql`](https://github.com/wooorm/refractor/blob/main/lang/n1ql.js)
*   [ ] [`n4js`](https://github.com/wooorm/refractor/blob/main/lang/n4js.js) — alias: `n4jsd`
*   [ ] [`nand2tetris-hdl`](https://github.com/wooorm/refractor/blob/main/lang/nand2tetris-hdl.js)
*   [ ] [`naniscript`](https://github.com/wooorm/refractor/blob/main/lang/naniscript.js) — alias: `nani`
*   [ ] [`nasm`](https://github.com/wooorm/refractor/blob/main/lang/nasm.js)
*   [ ] [`neon`](https://github.com/wooorm/refractor/blob/main/lang/neon.js)
*   [ ] [`nevod`](https://github.com/wooorm/refractor/blob/main/lang/nevod.js)
*   [ ] [`nginx`](https://github.com/wooorm/refractor/blob/main/lang/nginx.js)
*   [ ] [`nim`](https://github.com/wooorm/refractor/blob/main/lang/nim.js)
*   [ ] [`nix`](https://github.com/wooorm/refractor/blob/main/lang/nix.js)
*   [ ] [`nsis`](https://github.com/wooorm/refractor/blob/main/lang/nsis.js)
*   [ ] [`ocaml`](https://github.com/wooorm/refractor/blob/main/lang/ocaml.js)
*   [ ] [`odin`](https://github.com/wooorm/refractor/blob/main/lang/odin.js)
*   [ ] [`opencl`](https://github.com/wooorm/refractor/blob/main/lang/opencl.js)
*   [ ] [`openqasm`](https://github.com/wooorm/refractor/blob/main/lang/openqasm.js) — alias: `qasm`
*   [ ] [`oz`](https://github.com/wooorm/refractor/blob/main/lang/oz.js)
*   [ ] [`parigp`](https://github.com/wooorm/refractor/blob/main/lang/parigp.js)
*   [ ] [`parser`](https://github.com/wooorm/refractor/blob/main/lang/parser.js)
*   [ ] [`pascal`](https://github.com/wooorm/refractor/blob/main/lang/pascal.js) — alias: `objectpascal`
*   [ ] [`pascaligo`](https://github.com/wooorm/refractor/blob/main/lang/pascaligo.js)
*   [ ] [`pcaxis`](https://github.com/wooorm/refractor/blob/main/lang/pcaxis.js) — alias: `px`
*   [ ] [`peoplecode`](https://github.com/wooorm/refractor/blob/main/lang/peoplecode.js) — alias: `pcode`
*   [ ] [`php-extras`](https://github.com/wooorm/refractor/blob/main/lang/php-extras.js)
*   [ ] [`phpdoc`](https://github.com/wooorm/refractor/blob/main/lang/phpdoc.js)
*   [ ] [`plant-uml`](https://github.com/wooorm/refractor/blob/main/lang/plant-uml.js) — alias: `plantuml`
*   [ ] [`plsql`](https://github.com/wooorm/refractor/blob/main/lang/plsql.js)
*   [ ] [`powerquery`](https://github.com/wooorm/refractor/blob/main/lang/powerquery.js) — alias: `mscript`, `pq`
*   [ ] [`powershell`](https://github.com/wooorm/refractor/blob/main/lang/powershell.js)
*   [ ] [`processing`](https://github.com/wooorm/refractor/blob/main/lang/processing.js)
*   [ ] [`prolog`](https://github.com/wooorm/refractor/blob/main/lang/prolog.js)
*   [ ] [`promql`](https://github.com/wooorm/refractor/blob/main/lang/promql.js)
*   [ ] [`properties`](https://github.com/wooorm/refractor/blob/main/lang/properties.js)
*   [ ] [`protobuf`](https://github.com/wooorm/refractor/blob/main/lang/protobuf.js)
*   [ ] [`psl`](https://github.com/wooorm/refractor/blob/main/lang/psl.js)
*   [ ] [`pug`](https://github.com/wooorm/refractor/blob/main/lang/pug.js)
*   [ ] [`puppet`](https://github.com/wooorm/refractor/blob/main/lang/puppet.js)
*   [ ] [`pure`](https://github.com/wooorm/refractor/blob/main/lang/pure.js)
*   [ ] [`purebasic`](https://github.com/wooorm/refractor/blob/main/lang/purebasic.js) — alias: `pbfasm`
*   [ ] [`purescript`](https://github.com/wooorm/refractor/blob/main/lang/purescript.js) — alias: `purs`
*   [ ] [`q`](https://github.com/wooorm/refractor/blob/main/lang/q.js)
*   [ ] [`qml`](https://github.com/wooorm/refractor/blob/main/lang/qml.js)
*   [ ] [`qore`](https://github.com/wooorm/refractor/blob/main/lang/qore.js)
*   [ ] [`qsharp`](https://github.com/wooorm/refractor/blob/main/lang/qsharp.js) — alias: `qs`
*   [ ] [`racket`](https://github.com/wooorm/refractor/blob/main/lang/racket.js) — alias: `rkt`
*   [ ] [`reason`](https://github.com/wooorm/refractor/blob/main/lang/reason.js)
*   [ ] [`rego`](https://github.com/wooorm/refractor/blob/main/lang/rego.js)
*   [ ] [`renpy`](https://github.com/wooorm/refractor/blob/main/lang/renpy.js) — alias: `rpy`
*   [ ] [`rescript`](https://github.com/wooorm/refractor/blob/main/lang/rescript.js) — alias: `res`
*   [ ] [`rest`](https://github.com/wooorm/refractor/blob/main/lang/rest.js)
*   [ ] [`rip`](https://github.com/wooorm/refractor/blob/main/lang/rip.js)
*   [ ] [`roboconf`](https://github.com/wooorm/refractor/blob/main/lang/roboconf.js)
*   [ ] [`robotframework`](https://github.com/wooorm/refractor/blob/main/lang/robotframework.js) — alias: `robot`
*   [ ] [`sas`](https://github.com/wooorm/refractor/blob/main/lang/sas.js)
*   [ ] [`scala`](https://github.com/wooorm/refractor/blob/main/lang/scala.js)
*   [ ] [`scheme`](https://github.com/wooorm/refractor/blob/main/lang/scheme.js)
*   [ ] [`shell-session`](https://github.com/wooorm/refractor/blob/main/lang/shell-session.js) — alias: `sh-session`, `shellsession`
*   [ ] [`smali`](https://github.com/wooorm/refractor/blob/main/lang/smali.js)
*   [ ] [`smalltalk`](https://github.com/wooorm/refractor/blob/main/lang/smalltalk.js)
*   [ ] [`smarty`](https://github.com/wooorm/refractor/blob/main/lang/smarty.js)
*   [ ] [`sml`](https://github.com/wooorm/refractor/blob/main/lang/sml.js) — alias: `smlnj`
*   [ ] [`solidity`](https://github.com/wooorm/refractor/blob/main/lang/solidity.js) — alias: `sol`
*   [ ] [`solution-file`](https://github.com/wooorm/refractor/blob/main/lang/solution-file.js) — alias: `sln`
*   [ ] [`soy`](https://github.com/wooorm/refractor/blob/main/lang/soy.js)
*   [ ] [`sparql`](https://github.com/wooorm/refractor/blob/main/lang/sparql.js) — alias: `rq`
*   [ ] [`splunk-spl`](https://github.com/wooorm/refractor/blob/main/lang/splunk-spl.js)
*   [ ] [`sqf`](https://github.com/wooorm/refractor/blob/main/lang/sqf.js)
*   [ ] [`squirrel`](https://github.com/wooorm/refractor/blob/main/lang/squirrel.js)
*   [ ] [`stan`](https://github.com/wooorm/refractor/blob/main/lang/stan.js)
*   [ ] [`stata`](https://github.com/wooorm/refractor/blob/main/lang/stata.js)
*   [ ] [`stylus`](https://github.com/wooorm/refractor/blob/main/lang/stylus.js)
*   [ ] [`supercollider`](https://github.com/wooorm/refractor/blob/main/lang/supercollider.js) — alias: `sclang`
*   [ ] [`systemd`](https://github.com/wooorm/refractor/blob/main/lang/systemd.js)
*   [ ] [`t4-cs`](https://github.com/wooorm/refractor/blob/main/lang/t4-cs.js) — alias: `t4`
*   [ ] [`t4-templating`](https://github.com/wooorm/refractor/blob/main/lang/t4-templating.js)
*   [ ] [`t4-vb`](https://github.com/wooorm/refractor/blob/main/lang/t4-vb.js)
*   [ ] [`tap`](https://github.com/wooorm/refractor/blob/main/lang/tap.js)
*   [ ] [`tcl`](https://github.com/wooorm/refractor/blob/main/lang/tcl.js)
*   [ ] [`textile`](https://github.com/wooorm/refractor/blob/main/lang/textile.js)
*   [ ] [`toml`](https://github.com/wooorm/refractor/blob/main/lang/toml.js)
*   [ ] [`tremor`](https://github.com/wooorm/refractor/blob/main/lang/tremor.js) — alias: `trickle`, `troy`
*   [ ] [`tsx`](https://github.com/wooorm/refractor/blob/main/lang/tsx.js)
*   [ ] [`tt2`](https://github.com/wooorm/refractor/blob/main/lang/tt2.js)
*   [ ] [`turtle`](https://github.com/wooorm/refractor/blob/main/lang/turtle.js) — alias: `trig`
*   [ ] [`twig`](https://github.com/wooorm/refractor/blob/main/lang/twig.js)
*   [ ] [`typoscript`](https://github.com/wooorm/refractor/blob/main/lang/typoscript.js) — alias: `tsconfig`
*   [ ] [`unrealscript`](https://github.com/wooorm/refractor/blob/main/lang/unrealscript.js) — alias: `uc`, `uscript`
*   [ ] [`uorazor`](https://github.com/wooorm/refractor/blob/main/lang/uorazor.js)
*   [ ] [`uri`](https://github.com/wooorm/refractor/blob/main/lang/uri.js) — alias: `url`
*   [ ] [`v`](https://github.com/wooorm/refractor/blob/main/lang/v.js)
*   [ ] [`vala`](https://github.com/wooorm/refractor/blob/main/lang/vala.js)
*   [ ] [`velocity`](https://github.com/wooorm/refractor/blob/main/lang/velocity.js)
*   [ ] [`verilog`](https://github.com/wooorm/refractor/blob/main/lang/verilog.js)
*   [ ] [`vhdl`](https://github.com/wooorm/refractor/blob/main/lang/vhdl.js)
*   [ ] [`vim`](https://github.com/wooorm/refractor/blob/main/lang/vim.js)
*   [ ] [`visual-basic`](https://github.com/wooorm/refractor/blob/main/lang/visual-basic.js) — alias: `vb`, `vba`
*   [ ] [`warpscript`](https://github.com/wooorm/refractor/blob/main/lang/warpscript.js)
*   [ ] [`wasm`](https://github.com/wooorm/refractor/blob/main/lang/wasm.js)
*   [ ] [`web-idl`](https://github.com/wooorm/refractor/blob/main/lang/web-idl.js) — alias: `webidl`
*   [ ] [`wgsl`](https://github.com/wooorm/refractor/blob/main/lang/wgsl.js)
*   [ ] [`wiki`](https://github.com/wooorm/refractor/blob/main/lang/wiki.js)
*   [ ] [`wolfram`](https://github.com/wooorm/refractor/blob/main/lang/wolfram.js) — alias: `mathematica`, `nb`, `wl`
*   [ ] [`wren`](https://github.com/wooorm/refractor/blob/main/lang/wren.js)
*   [ ] [`xeora`](https://github.com/wooorm/refractor/blob/main/lang/xeora.js) — alias: `xeoracube`
*   [ ] [`xml-doc`](https://github.com/wooorm/refractor/blob/main/lang/xml-doc.js)
*   [ ] [`xojo`](https://github.com/wooorm/refractor/blob/main/lang/xojo.js)
*   [ ] [`xquery`](https://github.com/wooorm/refractor/blob/main/lang/xquery.js)
*   [ ] [`yang`](https://github.com/wooorm/refractor/blob/main/lang/yang.js)
*   [ ] [`zig`](https://github.com/wooorm/refractor/blob/main/lang/zig.js)

<!--support end-->

## CSS

`refractor` does not inject CSS for the syntax highlighted code (because well,
refractor doesn’t have to be turned into HTML and might not run in a browser!).
If you are in a browser, you can use any Prism theme.
For example, to get Prism Dark from cdnjs:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.27.0/themes/prism-dark.min.css">
```

<!--Old name of the following section:-->

<a name="plugins"></a>

## Compatibility

This package is at least compatible with all maintained versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
It also works in Deno and modern browsers.

Only the custom built syntaxes in `refractor/lang/*.js` will work with
`refractor` as Prism’s own syntaxes are made to work with global variables and
are not importable.

refractor also does not support Prism plugins, due to the same limitations, and
that they almost exclusively deal with the DOM.

## Security

This package is safe.

## Related

*   [`lowlight`][lowlight]
    — the same as refractor but with [`highlight.js`][hljs]
*   [`starry-night`][starry-night]
    — similar but like GitHub and really good

## Projects

*   [`react-syntax-highlighter`](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
    — [React][] component for syntax highlighting
*   [`@mapbox/rehype-prism`](https://github.com/mapbox/rehype-prism)
    — [**rehype**][rehype] plugin to highlight code
    blocks
*   [`react-refractor`](https://github.com/rexxars/react-refractor)
    — syntax highlighter for [React][]

## Contribute

Yes please!
See [How to Contribute to Open Source][contribute].

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/wooorm/refractor/workflows/main/badge.svg

[build]: https://github.com/wooorm/refractor/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/refractor.svg

[coverage]: https://codecov.io/github/wooorm/refractor

[downloads-badge]: https://img.shields.io/npm/dm/refractor.svg

[downloads]: https://www.npmjs.com/package/refractor

[size-badge]: https://img.shields.io/bundlephobia/minzip/refractor.svg

[size]: https://bundlephobia.com/result?p=refractor

[npm]: https://docs.npmjs.com/cli/install

[esmsh]: https://esm.sh

[license]: license

[author]: https://wooorm.com

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[contribute]: https://opensource.guide/how-to-contribute/

[rehype]: https://github.com/rehypejs/rehype

[names]: https://prismjs.com/#languages-list

[react]: https://facebook.github.io/react/

[prism]: https://github.com/PrismJS/prism

[lowlight]: https://github.com/wooorm/lowlight

[hljs]: https://github.com/highlightjs/highlight.js

[starry-night]: https://github.com/wooorm/starry-night

[root]: https://github.com/syntax-tree/hast#root

[hast-util-to-html]: https://github.com/syntax-tree/hast-util-to-html

[hast-to-hyperscript]: https://github.com/syntax-tree/hast-to-hyperscript
