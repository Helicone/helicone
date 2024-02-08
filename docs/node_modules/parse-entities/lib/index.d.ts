/**
 * Parse HTML character references.
 *
 * @param {string} value
 * @param {import('../index.js').Options} [options={}]
 */
export function parseEntities(
  value: string,
  options?:
    | import('../index.js').Options<undefined, undefined, undefined>
    | undefined
): string
export type Point = import('unist').Point
export type Position = import('unist').Position
