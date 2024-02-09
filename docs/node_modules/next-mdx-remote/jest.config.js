/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

export default {
  testPathIgnorePatterns: ['fixtures'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@mdx-js|unist-|unified|bail|is-plain-obj|trough|vfile|remark-|micromark-|micromark|estree-util-|parse-entities|character-entities|mdast-util-|character-reference-invalid|is-|stringify-entities|periscopic|hast-util-|comma-separated-tokens|property-information|space-separated-tokens|zwitch|ccount|decode-named-character-reference|trim-lines))',
  ],
  transform: {
    '\\.m?[jt]sx?$': [
      'esbuild-jest',
      {
        sourcemap: true,
        loaders: {
          '.mjs': 'jsx',
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs'],
  verbose: true,
}
