import {start as startRe, cont as contRe} from './regex.js'

/**
 * Checks if the given character code can start an identifier.
 *
 * @param {number} code
 *   Character code to check.
 * @returns {boolean}
 *   Whether `code` can start an identifier.
 */
// To do: support astrals.
export function start(code) {
  return startRe.test(String.fromCharCode(code))
}

/**
 * Checks if the given character code can continue an identifier.
 *
 * @param {number} code
 *   Character code to check.
 * @returns {boolean}
 *   Whether `code` can continue an identifier.
 */
// To do: support astrals.
export function cont(code) {
  const character = String.fromCharCode(code)
  return startRe.test(character) || contRe.test(character)
}

/**
 * Checks if the given value is a valid identifier name.
 *
 * @param {string} name
 *   Identifier to check.
 * @returns {boolean}
 *   Whether `name` can be an identifier.
 */
export function name(name) {
  let index = -1

  while (++index < name.length) {
    if (!(index ? cont : start)(name.charCodeAt(index))) return false
  }

  // `false` if `name` is empty.
  return index > 0
}
