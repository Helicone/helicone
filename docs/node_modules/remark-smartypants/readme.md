# remark-smartypants

[![package version](https://badgen.net/npm/v/remark-smartypants)][npm]
[![number of downloads](https://badgen.net/npm/dt/remark-smartypants)][npm]

[remark] plugin to implement [SmartyPants]. Now with 100% more ESM!

## Installing

```sh
# using npm
npm install remark-smartypants

# using yarn
yarn add remark-smartypants
```

## Usage

Example using [remark]:

```js
import remark from "remark";
import smartypants from "remark-smartypants";

const result = await remark().use(smartypants).process("# <<Hello World!>>");

console.log(String(result));
// # «Hello World!»
```

I created this plugin because I wanted to add SmartyPants to [MDX]:

```js
import mdx from "@mdx-js/mdx";
import smartypants from "remark-smartypants";

const result = await mdx("# ---Hello World!---", {
  remarkPlugins: [smartypants],
});
```

Note that angle quotes in the former example (`<<...>>`) are probably impossible in MDX because there they are invalid syntax.

This plugin uses [retext-smartypants](https://github.com/retextjs/retext-smartypants) under the hood, so it takes the same options:

```js
const result = await remark()
  .use(smartypants, { dashes: "oldschool" })
  .process("en dash (--), em dash (---)");
```

## License

[MIT License, Copyright (c) Matija Marohnić](./LICENSE)

[npm]: https://www.npmjs.com/package/remark-smartypants
[remark]: https://remark.js.org
[SmartyPants]: https://daringfireball.net/projects/smartypants
[MDX]: https://mdxjs.com
