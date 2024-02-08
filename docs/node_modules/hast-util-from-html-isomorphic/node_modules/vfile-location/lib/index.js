/**
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('vfile').Value} Value
 * @typedef {import('unist').Point} UnistPoint
 */

/**
 *
 * @typedef PointLike
 *   unist point, allowed as input.
 * @property {number | null | undefined} [line]
 *   Line.
 * @property {number | null | undefined} [column]
 *   Column.
 * @property {number | null | undefined} [offset]
 *   Offset.
 *
 * @callback ToPoint
 *   Get the line/column based `Point` for `offset` in the bound indices.
 *
 *   Returns `undefined` when given out of bounds input.
 *
 *   Also implemented in Rust in [`wooorm/markdown-rs`][markdown-rs].
 *
 *   [markdown-rs]: https://github.com/wooorm/markdown-rs/blob/main/src/util/location.rs
 * @param {number | null | undefined} [offset]
 *   Something that should be an `offset.
 * @returns {UnistPoint | undefined}
 *   Point, if `offset` is valid and in-bounds input.
 *
 * @callback ToOffset
 *   Get the `offset` from a line/column based `Point` in the bound indices.
 * @param {PointLike | null | undefined} [point]
 *   Something that should be a `point.
 * @returns {number | undefined}
 *   Offset (`number`) or `undefined` for invalid or out of bounds input.
 *
 * @typedef Location
 *   Accessors for index.
 * @property {ToPoint} toPoint
 *   Get the line/column based `Point` for `offset` in the bound indices.
 * @property {ToOffset} toOffset
 *   Get the `offset` from a line/column based `Point` in the bound indices.
 */

const search = /\r?\n|\r/g

/**
 * Create an index of the given document to translate between line/column and
 * offset based positional info.
 *
 * Also implemented in Rust in [`wooorm/markdown-rs`][markdown-rs].
 *
 * [markdown-rs]: https://github.com/wooorm/markdown-rs/blob/main/src/util/location.rs
 *
 * @param {VFile | Value} file
 *   File to index.
 * @returns {Location}
 *   Accessors for index.
 */
export function location(file) {
  const value = String(file)
  /**
   * List, where each index is a line number (0-based), and each value is the
   * byte index *after* where the line ends.
   *
   * @type {Array<number>}
   */
  const indices = []

  search.lastIndex = 0

  while (search.test(value)) {
    indices.push(search.lastIndex)
  }

  indices.push(value.length + 1)

  return {toPoint, toOffset}

  /** @type {ToPoint} */
  function toPoint(offset) {
    let index = -1

    if (
      typeof offset === 'number' &&
      offset > -1 &&
      offset < indices[indices.length - 1]
    ) {
      while (++index < indices.length) {
        if (indices[index] > offset) {
          return {
            line: index + 1,
            column: offset - (index > 0 ? indices[index - 1] : 0) + 1,
            offset
          }
        }
      }
    }
  }

  /** @type {ToOffset} */
  function toOffset(point) {
    const line = point && point.line
    const column = point && point.column

    if (
      typeof line === 'number' &&
      typeof column === 'number' &&
      !Number.isNaN(line) &&
      !Number.isNaN(column) &&
      line - 1 in indices
    ) {
      const offset = (indices[line - 2] || 0) + column - 1 || 0

      if (offset > -1 && offset < indices[indices.length - 1]) {
        return offset
      }
    }
  }
}
