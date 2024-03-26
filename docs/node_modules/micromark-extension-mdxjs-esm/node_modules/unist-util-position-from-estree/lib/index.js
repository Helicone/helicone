/**
 * @typedef {import('unist').Position} Position
 *
 * @typedef {[number, number]} RangeLike
 *
 * @typedef PointLike
 * @property {number | null | undefined} [line]
 * @property {number | null | undefined} [column]
 *
 * @typedef LocLike
 * @property {PointLike | null | undefined} [start]
 * @property {PointLike | null | undefined} [end]
 *
 * @typedef NodeLike
 * @property {LocLike | null | undefined} [loc]
 * @property {RangeLike | null | undefined} [range]
 * @property {number | null | undefined} [start]
 * @property {number | null | undefined} [end]
 */

/**
 * Turn an estree `node` into a unist `position`.
 *
 * @param {NodeLike | null | undefined} [node]
 *   estree node.
 * @returns {Position}
 *   unist position.
 */
export function positionFromEstree(node) {
  const nodeLike = node || {}
  const loc = nodeLike.loc || {}
  const range = nodeLike.range || [0, 0]
  const startColumn = loc.start
    ? numberOrUndefined(loc.start.column)
    : undefined
  const endColumn = loc.end ? numberOrUndefined(loc.end.column) : undefined

  return {
    start: {
      // @ts-expect-error: return no point / no position next major.
      line: loc.start ? numberOrUndefined(loc.start.line) : undefined,
      // @ts-expect-error: return no point / no position next major.
      column: startColumn === undefined ? undefined : startColumn + 1,
      offset: numberOrUndefined(range[0] || nodeLike.start)
    },
    end: {
      // @ts-expect-error: return no point / no position next major.
      line: loc.end ? numberOrUndefined(loc.end.line) : undefined,
      // @ts-expect-error: return no point / no position next major.
      column: endColumn === undefined ? undefined : endColumn + 1,
      offset: numberOrUndefined(range[1] || nodeLike.end)
    }
  }
}

/**
 *
 * @param {number | null | undefined} value
 * @returns {number | undefined}
 */
function numberOrUndefined(value) {
  return typeof value === 'number' && value > -1 ? value : undefined
}
