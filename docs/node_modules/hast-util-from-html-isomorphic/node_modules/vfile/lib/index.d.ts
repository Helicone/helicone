export class VFile {
  /**
   * Create a new virtual file.
   *
   * `options` is treated as:
   *
   * *   `string` or `Uint8Array` — `{value: options}`
   * *   `URL` — `{path: options}`
   * *   `VFile` — shallow copies its data over to the new file
   * *   `object` — all fields are shallow copied over to the new file
   *
   * Path related fields are set in the following order (least specific to
   * most specific): `history`, `path`, `basename`, `stem`, `extname`,
   * `dirname`.
   *
   * You cannot set `dirname` or `extname` without setting either `history`,
   * `path`, `basename`, or `stem` too.
   *
   * @param {Compatible | null | undefined} [value]
   *   File value.
   * @returns
   *   New instance.
   */
  constructor(value?: Compatible | null | undefined)
  /**
   * Base of `path` (default: `process.cwd()` or `'/'` in browsers).
   *
   * @type {string}
   */
  cwd: string
  /**
   * Place to store custom info (default: `{}`).
   *
   * It’s OK to store custom data directly on the file but moving it to
   * `data` is recommended.
   *
   * @type {Data}
   */
  data: Data
  /**
   * List of file paths the file moved between.
   *
   * The first is the original path and the last is the current path.
   *
   * @type {Array<string>}
   */
  history: Array<string>
  /**
   * List of messages associated with the file.
   *
   * @type {Array<VFileMessage>}
   */
  messages: Array<VFileMessage>
  /**
   * Raw value.
   *
   * @type {Value}
   */
  value: Value
  /**
   * Source map.
   *
   * This type is equivalent to the `RawSourceMap` type from the `source-map`
   * module.
   *
   * @type {Map | null | undefined}
   */
  map: Map | null | undefined
  /**
   * Custom, non-string, compiled, representation.
   *
   * This is used by unified to store non-string results.
   * One example is when turning markdown into React nodes.
   *
   * @type {unknown}
   */
  result: unknown
  /**
   * Whether a file was saved to disk.
   *
   * This is used by vfile reporters.
   *
   * @type {boolean}
   */
  stored: boolean
  /**
   * Set basename (including extname) (`'index.min.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} basename
   *   Basename.
   * @returns {undefined}
   *   Nothing.
   */
  set basename(arg: string | undefined)
  /**
   * Get the basename (including extname) (example: `'index.min.js'`).
   *
   * @returns {string | undefined}
   *   Basename.
   */
  get basename(): string | undefined
  /**
   * Set the full path (example: `'~/index.min.js'`).
   *
   * Cannot be nullified.
   * You can set a file URL (a `URL` object with a `file:` protocol) which will
   * be turned into a path with `url.fileURLToPath`.
   *
   * @param {URL | string} path
   *   Path.
   * @returns {undefined}
   *   Nothing.
   */
  set path(arg: string)
  /**
   * Get the full path (example: `'~/index.min.js'`).
   *
   * @returns {string}
   *   Path.
   */
  get path(): string
  /**
   * Set the parent path (example: `'~'`).
   *
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} dirname
   *   Dirname.
   * @returns {undefined}
   *   Nothing.
   */
  set dirname(arg: string | undefined)
  /**
   * Get the parent path (example: `'~'`).
   *
   * @returns {string | undefined}
   *   Dirname.
   */
  get dirname(): string | undefined
  /**
   * Set the extname (including dot) (example: `'.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} extname
   *   Extname.
   * @returns {undefined}
   *   Nothing.
   */
  set extname(arg: string | undefined)
  /**
   * Get the extname (including dot) (example: `'.js'`).
   *
   * @returns {string | undefined}
   *   Extname.
   */
  get extname(): string | undefined
  /**
   * Set the stem (basename w/o extname) (example: `'index.min'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} stem
   *   Stem.
   * @returns {undefined}
   *   Nothing.
   */
  set stem(arg: string | undefined)
  /**
   * Get the stem (basename w/o extname) (example: `'index.min'`).
   *
   * @returns {string | undefined}
   *   Stem.
   */
  get stem(): string | undefined
  fail(reason: string, options?: MessageOptions | null | undefined): never
  fail(
    reason: string,
    parent: Node | NodeLike | null | undefined,
    origin?: string | null | undefined
  ): never
  fail(
    reason: string,
    place: Point | Position | null | undefined,
    origin?: string | null | undefined
  ): never
  fail(reason: string, origin?: string | null | undefined): never
  fail(
    cause: Error | VFileMessage,
    parent: Node | NodeLike | null | undefined,
    origin?: string | null | undefined
  ): never
  fail(
    cause: Error | VFileMessage,
    place: Point | Position | null | undefined,
    origin?: string | null | undefined
  ): never
  fail(cause: Error | VFileMessage, origin?: string | null | undefined): never
  info(
    reason: string,
    options?: MessageOptions | null | undefined
  ): VFileMessage
  info(
    reason: string,
    parent: Node | NodeLike | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  info(
    reason: string,
    place: Point | Position | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  info(reason: string, origin?: string | null | undefined): VFileMessage
  info(
    cause: Error | VFileMessage,
    parent: Node | NodeLike | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  info(
    cause: Error | VFileMessage,
    place: Point | Position | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  info(
    cause: Error | VFileMessage,
    origin?: string | null | undefined
  ): VFileMessage
  message(
    reason: string,
    options?: MessageOptions | null | undefined
  ): VFileMessage
  message(
    reason: string,
    parent: Node | NodeLike | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  message(
    reason: string,
    place: Point | Position | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  message(reason: string, origin?: string | null | undefined): VFileMessage
  message(
    cause: Error | VFileMessage,
    parent: Node | NodeLike | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  message(
    cause: Error | VFileMessage,
    place: Point | Position | null | undefined,
    origin?: string | null | undefined
  ): VFileMessage
  message(
    cause: Error | VFileMessage,
    origin?: string | null | undefined
  ): VFileMessage
  /**
   * Serialize the file.
   *
   * > **Note**: which encodings are supported depends on the engine.
   * > For info on Node.js, see:
   * > <https://nodejs.org/api/util.html#whatwg-supported-encodings>.
   *
   * @param {string | null | undefined} [encoding='utf8']
   *   Character encoding to understand `value` as when it’s a `Uint8Array`
   *   (default: `'utf-8'`).
   * @returns {string}
   *   Serialized file.
   */
  toString(encoding?: string | null | undefined): string
}
export type Node = import('unist').Node
export type Point = import('unist').Point
export type Position = import('unist').Position
export type MessageOptions = import('vfile-message').Options
export type Data = import('../index.js').Data
export type Value = import('../index.js').Value
export type NodeLike = object & {
  type: string
  position?: Position | undefined
}
/**
 * Things that can be passed to the constructor.
 */
export type Compatible = Options | URL | VFile | Value
/**
 * Set multiple values.
 */
export type VFileCoreOptions = {
  /**
   * Set `basename` (name).
   */
  basename?: string | null | undefined
  /**
   * Set `cwd` (working directory).
   */
  cwd?: string | null | undefined
  /**
   * Set `data` (associated info).
   */
  data?: Data | null | undefined
  /**
   * Set `dirname` (path w/o basename).
   */
  dirname?: string | null | undefined
  /**
   * Set `extname` (extension with dot).
   */
  extname?: string | null | undefined
  /**
   * Set `history` (paths the file moved between).
   */
  history?: Array<string> | null | undefined
  /**
   * Set `path` (current path).
   */
  path?: URL | string | null | undefined
  /**
   * Set `stem` (name without extension).
   */
  stem?: string | null | undefined
  /**
   * Set `value` (the contents of the file).
   */
  value?: Value | null | undefined
}
/**
 * Raw source map.
 *
 * See:
 * <https://github.com/mozilla/source-map/blob/60adcb0/source-map.d.ts#L15-L23>.
 */
export type Map = {
  /**
   *  Which version of the source map spec this map is following.
   */
  version: number
  /**
   *  An array of URLs to the original source files.
   */
  sources: Array<string>
  /**
   *  An array of identifiers which can be referenced by individual mappings.
   */
  names: Array<string>
  /**
   * The URL root from which all sources are relative.
   */
  sourceRoot?: string | undefined
  /**
   * An array of contents of the original source files.
   */
  sourcesContent?: Array<string> | undefined
  /**
   *  A string of base64 VLQs which contain the actual mappings.
   */
  mappings: string
  /**
   *  The generated file this source map is associated with.
   */
  file: string
}
/**
 * Configuration.
 *
 * A bunch of keys that will be shallow copied over to the new file.
 */
export type Options = Record<string, unknown> & VFileCoreOptions
/**
 * Configuration for reporters.
 */
export type ReporterSettings = Record<string, unknown>
/**
 * Type for a reporter.
 */
export type Reporter<Settings = ReporterSettings> = (
  files: Array<VFile>,
  options: Settings
) => string
import {VFileMessage} from 'vfile-message'
