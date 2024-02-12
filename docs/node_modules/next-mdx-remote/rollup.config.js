/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import resolve from '@rollup/plugin-node-resolve'
import cjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import ts from '@rollup/plugin-typescript'

const extensions = ['.js', '.jsx', '.ts', '.tsx']

export default [
  {
    input: './src/index.tsx',
    output: {
      dir: './dist',
      format: 'es',
    },
    external: [
      'react',
      '@mdx-js/react',
      'react/jsx-runtime',
      './jsx-runtime.cjs',
    ],
    plugins: [
      ts({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        exclude: ['./__tests__/**/*'],
      }),
      resolve(),
      {
        // ensure that the requestIdleCallback polyfill file is marked as having
        // side-effects so that it gets bundled
        name: 'ensure-idle-callback-polyfill',
        transform(code, id) {
          if (id.includes('idle-callback-polyfill.js')) {
            return { code, moduleSideEffects: true }
          }
        },
      },
    ],
  },
  {
    input: './src/rsc.tsx',
    output: {
      dir: './dist',
      format: 'es',
    },
    external: [
      'react',
      '@mdx-js/react',
      'react/jsx-runtime',
      './jsx-runtime.cjs',
      '@mdx-js/mdx',
      'vfile',
      'vfile-matter',
    ],
    plugins: [
      ts({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        exclude: ['./__tests__/**/*'],
      }),
      json(),
      resolve(),
      cjs(),
    ],
  },
  {
    input: './src/serialize.ts',
    output: {
      dir: './dist',
      format: 'es',
    },
    external: ['@mdx-js/mdx', 'vfile', 'vfile-matter'],
    plugins: [
      ts({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        exclude: ['./__tests__/**/*'],
      }),
      json(),
      resolve(),
      cjs(),
    ],
  },
]
