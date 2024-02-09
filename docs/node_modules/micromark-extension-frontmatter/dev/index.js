/**
 * @typedef {import('./matters.js').Info} Info
 * @typedef {import('./matters.js').Matter} Matter
 * @typedef {import('./matters.js').Options} Options
 * @typedef {import('./matters.js').Preset} Preset
 */

export {frontmatter} from './lib/syntax.js'
export {frontmatterHtml} from './lib/html.js'

// Note: we don’t have an `index.d.ts` in this extension because all token
// types are dynamic in JS
