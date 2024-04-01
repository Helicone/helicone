# rollup-plugin-inject

## 3.0.1

* Generate sourcemap when sourcemap enabled

## 3.0.0

* Remove node v6 from support
* Use modern js

## 2.1.0

* Update all dependencies ([#15](https://github.com/rollup/rollup-plugin-inject/pull/15))

## 2.0.0

* Work with all file extensions, not just `.js` (unless otherwise specified via `options.include` and `options.exclude`) ([#6](https://github.com/rollup/rollup-plugin-inject/pull/6))
* Allow `*` imports ([#9](https://github.com/rollup/rollup-plugin-inject/pull/9))
* Ignore replacements that are superseded (e.g. if `Buffer.isBuffer` is replaced, ignore `Buffer` replacement) ([#10](https://github.com/rollup/rollup-plugin-inject/pull/10))

## 1.4.1

* Return a `name`

## 1.4.0

* Use `string.search` instead of `regex.test` to avoid state-related mishaps ([#5](https://github.com/rollup/rollup-plugin-inject/issues/5))
* Prevent self-importing module bug

## 1.3.0

* Windows support ([#2](https://github.com/rollup/rollup-plugin-inject/issues/2))
* Node 0.12 support

## 1.2.0

* Generate sourcemaps by default

## 1.1.1

* Use `modules` option

## 1.1.0

* Handle shorthand properties

## 1.0.0

* First release
