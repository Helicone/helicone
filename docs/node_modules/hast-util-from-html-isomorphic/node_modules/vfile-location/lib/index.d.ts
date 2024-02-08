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
export function location(file: VFile | Value): Location;
export type VFile = import('vfile').VFile;
export type Value = import('vfile').Value;
export type UnistPoint = import('unist').Point;
/**
 * unist point, allowed as input.
 */
export type PointLike = {
    /**
     * Line.
     */
    line?: number | null | undefined;
    /**
     * Column.
     */
    column?: number | null | undefined;
    /**
     * Offset.
     */
    offset?: number | null | undefined;
};
/**
 * Get the line/column based `Point` for `offset` in the bound indices.
 *
 * Returns `undefined` when given out of bounds input.
 *
 * Also implemented in Rust in [`wooorm/markdown-rs`][markdown-rs].
 *
 * [markdown-rs]: https://github.com/wooorm/markdown-rs/blob/main/src/util/location.rs
 */
export type ToPoint = (offset?: number | null | undefined) => UnistPoint | undefined;
/**
 * Get the `offset` from a line/column based `Point` in the bound indices.
 */
export type ToOffset = (point?: PointLike | null | undefined) => number | undefined;
/**
 * Accessors for index.
 */
export type Location = {
    /**
     *   Get the line/column based `Point` for `offset` in the bound indices.
     */
    toPoint: ToPoint;
    /**
     *   Get the `offset` from a line/column based `Point` in the bound indices.
     */
    toOffset: ToOffset;
};
