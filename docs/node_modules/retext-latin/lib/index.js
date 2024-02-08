/**
 * @typedef {import('nlcst').Root} Root
 */

import {unherit} from 'unherit'
// @ts-expect-error: untyped.
import {ParseLatin} from 'parse-latin'

/** @type {import('unified').ParserClass<Root>} */
export const Parser = ParseLatin

/** @type {import('unified').Plugin<void[], string, Root>} */
export default function retextLatin() {
  Object.assign(this, {Parser: unherit(ParseLatin)})
}
