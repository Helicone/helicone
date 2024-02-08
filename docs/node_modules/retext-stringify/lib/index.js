/**
 * @typedef {import('nlcst').Root} Root
 */

import {toString} from 'nlcst-to-string'

/** @type {import('unified').Plugin<void[], Root, string>} */
export default function retextStringify() {
  Object.assign(this, {Compiler})
}

/** @type {import('unified').CompilerFunction<Root, string>} */
function Compiler(tree) {
  return toString(tree)
}
