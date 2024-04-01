import { OnResolveArgs, Plugin } from 'esbuild'
import escapeStringRegexp from 'escape-string-regexp'
import fs from 'fs'
import path from 'path'
import esbuild from 'esbuild'
import { builtinsPolyfills } from './polyfills'

// import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve'
const NAME = 'node-modules-polyfills'
const NAMESPACE = NAME

function removeEndingSlash(importee) {
    if (importee && importee.slice(-1) === '/') {
        importee = importee.slice(0, -1)
    }
    return importee
}

export interface NodePolyfillsOptions {
    name?: string
    namespace?: string
}

export function NodeModulesPolyfillPlugin(
    options: NodePolyfillsOptions = {},
): Plugin {
    const { namespace = NAMESPACE, name = NAME } = options
    if (namespace.endsWith('commonjs')) {
        throw new Error(`namespace ${namespace} must not end with commonjs`)
    }
    // this namespace is needed to make ES modules expose their default export to require: require('assert') will give you import('assert').default
    const commonjsNamespace = namespace + '-commonjs'
    const polyfilledBuiltins = builtinsPolyfills()
    const polyfilledBuiltinsNames = [...polyfilledBuiltins.keys()]

    return {
        name,
        setup: function setup({ onLoad, onResolve, initialOptions }) {
            // polyfills contain global keyword, it must be defined
            if (initialOptions?.define && !initialOptions.define?.global) {
                initialOptions.define['global'] = 'globalThis'
            } else if (!initialOptions?.define) {
                initialOptions.define = { global: 'globalThis' }
            }

            // TODO these polyfill module cannot import anything, is that ok?
            async function loader(
                args: esbuild.OnLoadArgs,
            ): Promise<esbuild.OnLoadResult> {
                try {
                    const isCommonjs = args.namespace.endsWith('commonjs')

                    const resolved = polyfilledBuiltins.get(
                        removeEndingSlash(args.path),
                    )
                    const contents = await (
                        await fs.promises.readFile(resolved)
                    ).toString()
                    let resolveDir = path.dirname(resolved)

                    if (isCommonjs) {
                        return {
                            loader: 'js',
                            contents: commonJsTemplate({
                                importPath: args.path,
                            }),
                            resolveDir,
                        }
                    }
                    return {
                        loader: 'js',
                        contents,
                        resolveDir,
                    }
                } catch (e) {
                    console.error('node-modules-polyfill', e)
                    return {
                        contents: `export {}`,
                        loader: 'js',
                    }
                }
            }
            onLoad({ filter: /.*/, namespace }, loader)
            onLoad({ filter: /.*/, namespace: commonjsNamespace }, loader)
            const filter = new RegExp(
                polyfilledBuiltinsNames.map(escapeStringRegexp).join('|'), // TODO builtins could end with slash, keep in mind in regex
            )
            async function resolver(args: OnResolveArgs) {
                const ignoreRequire = args.namespace === commonjsNamespace

                if (!polyfilledBuiltins.has(args.path)) {
                    return
                }

                const isCommonjs =
                    !ignoreRequire && args.kind === 'require-call'

                return {
                    namespace: isCommonjs ? commonjsNamespace : namespace,
                    path: args.path,
                }
            }
            onResolve({ filter }, resolver)
            // onResolve({ filter: /.*/, namespace }, resolver)
        },
    }
}

function commonJsTemplate({ importPath }) {
    return `
const polyfill = require('${importPath}')

if (polyfill && polyfill.default) {
    module.exports = polyfill.default
    for (let k in polyfill) {
        module.exports[k] = polyfill[k]
    }
} else if (polyfill)  {
    module.exports = polyfill
}


`
}

export default NodeModulesPolyfillPlugin
