/**
 * Utility to turn a list of extnames (*with* dots) into an expression.
 *
 * @param {Array<string>} extnames
 *   List of extnames.
 * @returns {RegExp}
 *   Regex matching them.
 */
export function extnamesToRegex(extnames: Array<string>): RegExp;
