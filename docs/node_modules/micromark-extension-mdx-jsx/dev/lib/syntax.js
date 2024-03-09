/**
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('micromark-factory-mdx-expression').Acorn} Acorn
 * @typedef {import('micromark-factory-mdx-expression').AcornOptions} AcornOptions
 */

/**
 * @typedef Options
 *   Configuration (optional).
 * @property {Acorn | null | undefined} [acorn]
 *   Acorn parser to use (optional).
 * @property {AcornOptions | null | undefined} [acornOptions]
 *   Configuration for acorn (default: `{ecmaVersion: 2020, locations: true,
 *   sourceType: 'module'}`).
 *
 *   All fields except `locations` can be set.
 * @property {boolean | null | undefined} [addResult=false]
 *   Whether to add `estree` fields to tokens with results from acorn.
 */

import {codes} from 'micromark-util-symbol/codes.js'
import {jsxText} from './jsx-text.js'
import {jsxFlow} from './jsx-flow.js'

/**
 * Create an extension for `micromark` to enable MDX JSX syntax.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to enable MDX
 *   JSX syntax.
 */
export function mdxJsx(options) {
  const settings = options || {}
  const acorn = settings.acorn
  /** @type {AcornOptions | undefined} */
  let acornOptions

  if (acorn) {
    if (!acorn.parse || !acorn.parseExpressionAt) {
      throw new Error(
        'Expected a proper `acorn` instance passed in as `options.acorn`'
      )
    }

    acornOptions = Object.assign(
      {ecmaVersion: 2020, sourceType: 'module'},
      settings.acornOptions,
      {locations: true}
    )
  } else if (settings.acornOptions || settings.addResult) {
    throw new Error('Expected an `acorn` instance passed in as `options.acorn`')
  }

  return {
    flow: {
      [codes.lessThan]: jsxFlow(
        acorn || undefined,
        acornOptions,
        settings.addResult || false
      )
    },
    text: {
      [codes.lessThan]: jsxText(
        acorn || undefined,
        acornOptions,
        settings.addResult || false
      )
    }
  }
}
