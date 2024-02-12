/**
 * Parse the YAML front matter in a [`vfile`](https://github.com/vfile/vfile), and add it as `file.data.matter`.
 *
 * If no matter is found in the file, nothing happens, except that `file.data.matter` is set to an empty object (`{}`).
 * @param {VFile} file Virtual file
 * @param {Options} [options] Options
 * @returns The given `file`
 */
export function matter(file: VFile, options?: Options): import('vfile').VFile
export type VFile = import('vfile').VFile
export type LoadOptions = import('js-yaml').LoadOptions
/**
 * VFile matter options
 */
export type Options = {
  /**
   * Remove the YAML front matter from the file
   */
  strip?: boolean
  /**
   * Options for the YAML parser
   */
  yaml?: Omit<LoadOptions, 'filename'>
}
