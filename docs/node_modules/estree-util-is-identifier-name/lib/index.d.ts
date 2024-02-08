/**
 * Checks if the given character code can start an identifier.
 *
 * @param {number} code
 *   Character code to check.
 * @returns {boolean}
 *   Whether `code` can start an identifier.
 */
export function start(code: number): boolean
/**
 * Checks if the given character code can continue an identifier.
 *
 * @param {number} code
 *   Character code to check.
 * @returns {boolean}
 *   Whether `code` can continue an identifier.
 */
export function cont(code: number): boolean
/**
 * Checks if the given value is a valid identifier name.
 *
 * @param {string} name
 *   Identifier to check.
 * @returns {boolean}
 *   Whether `name` can be an identifier.
 */
export function name(name: string): boolean
