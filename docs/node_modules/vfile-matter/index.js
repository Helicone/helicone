/**
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('js-yaml').LoadOptions} LoadOptions
 *
 * @typedef Options VFile matter options
 * @property {boolean} [strip=false] Remove the YAML front matter from the file
 * @property {Omit<LoadOptions, 'filename'>} [yaml] Options for the YAML parser
 */

import buffer from 'is-buffer'
import {load} from 'js-yaml'

/**
 * Parse the YAML front matter in a [`vfile`](https://github.com/vfile/vfile), and add it as `file.data.matter`.
 *
 * If no matter is found in the file, nothing happens, except that `file.data.matter` is set to an empty object (`{}`).
 * @param {VFile} file Virtual file
 * @param {Options} [options] Options
 * @returns The given `file`
 */
export function matter(file, options = {}) {
  var strip = options.strip
  var yamlOptions = options.yaml || {}
  var doc = String(file)
  var match =
    /^---(?:\r?\n|\r)(?:([\s\S]*?)(?:\r?\n|\r))?---(?:\r?\n|\r|$)/.exec(doc)

  if (match) {
    file.data.matter = load(
      match[1],
      Object.assign({}, yamlOptions, {filename: file.path})
    )

    if (strip) {
      doc = doc.slice(match[0].length)
      file.value = buffer(file.value) ? Buffer.from(doc) : doc
    }
  } else {
    file.data.matter = {}
  }

  return file
}
