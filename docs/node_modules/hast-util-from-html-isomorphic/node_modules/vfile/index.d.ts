/**
 * Contents of the file.
 *
 * Can either be text or a `Uint8Array` structure.
 */
export type Value = Uint8Array | string

/**
 * This map registers the type of the `data` key of a `VFile`.
 *
 * This type can be augmented to register custom `data` types.
 *
 * @example
 * declare module 'vfile' {
 *   interface DataMap {
 *     // `file.data.name` is typed as `string`
 *     name: string
 *   }
 * }
 */

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-interface
export interface DataMap {}

/**
 * Custom information.
 *
 * Known attributes can be added to @see {@link DataMap}
 */
export type Data = Record<string, unknown> & Partial<DataMap>

// To do: next major: remove.
// Deprecated names (w/ prefix):
export type {Data as VFileData, DataMap as VFileDataMap, Value as VFileValue}

export {VFile} from './lib/index.js'

export type {
  Compatible,
  Map,
  MessageOptions,
  Options,
  Reporter,
  ReporterSettings,
  // To do: next major: remove.
  // Deprecated names (w/ prefix):
  Compatible as VFileCompatible,
  Options as VFileOptions,
  Reporter as VFileReporter,
  ReporterSettings as VFileReporterSettings
} from './lib/index.js'
