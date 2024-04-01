var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import escapeStringRegexp from 'escape-string-regexp';
import fs from 'fs';
import path from 'path';
import { builtinsPolyfills } from './polyfills';
// import { NodeResolvePlugin } from '@esbuild-plugins/node-resolve'
const NAME = 'node-modules-polyfills';
const NAMESPACE = NAME;
function removeEndingSlash(importee) {
    if (importee && importee.slice(-1) === '/') {
        importee = importee.slice(0, -1);
    }
    return importee;
}
export function NodeModulesPolyfillPlugin(options = {}) {
    const { namespace = NAMESPACE, name = NAME } = options;
    if (namespace.endsWith('commonjs')) {
        throw new Error(`namespace ${namespace} must not end with commonjs`);
    }
    // this namespace is needed to make ES modules expose their default export to require: require('assert') will give you import('assert').default
    const commonjsNamespace = namespace + '-commonjs';
    const polyfilledBuiltins = builtinsPolyfills();
    const polyfilledBuiltinsNames = [...polyfilledBuiltins.keys()];
    return {
        name,
        setup: function setup({ onLoad, onResolve, initialOptions }) {
            var _a;
            // polyfills contain global keyword, it must be defined
            if ((initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.define) && !((_a = initialOptions.define) === null || _a === void 0 ? void 0 : _a.global)) {
                initialOptions.define['global'] = '{}';
            }
            else if (!(initialOptions === null || initialOptions === void 0 ? void 0 : initialOptions.define)) {
                initialOptions.define = { global: '{}' };
            }
            // TODO these polyfill module cannot import anything, is that ok?
            function loader(args) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const isCommonjs = args.namespace.endsWith('commonjs');
                        const resolved = polyfilledBuiltins.get(removeEndingSlash(args.path));
                        const contents = yield (yield fs.promises.readFile(resolved)).toString();
                        let resolveDir = path.dirname(resolved);
                        if (isCommonjs) {
                            return {
                                loader: 'js',
                                contents: commonJsTemplate({
                                    importPath: args.path,
                                }),
                                resolveDir,
                            };
                        }
                        return {
                            loader: 'js',
                            contents,
                            resolveDir,
                        };
                    }
                    catch (e) {
                        console.error('node-modules-polyfill', e);
                        return {
                            contents: `export {}`,
                            loader: 'js',
                        };
                    }
                });
            }
            onLoad({ filter: /.*/, namespace }, loader);
            onLoad({ filter: /.*/, namespace: commonjsNamespace }, loader);
            const filter = new RegExp(polyfilledBuiltinsNames.map(escapeStringRegexp).join('|'));
            function resolver(args) {
                return __awaiter(this, void 0, void 0, function* () {
                    const ignoreRequire = args.namespace === commonjsNamespace;
                    if (!polyfilledBuiltins.has(args.path)) {
                        return;
                    }
                    const isCommonjs = !ignoreRequire && args.kind === 'require-call';
                    return {
                        namespace: isCommonjs ? commonjsNamespace : namespace,
                        path: args.path,
                    };
                });
            }
            onResolve({ filter }, resolver);
            // onResolve({ filter: /.*/, namespace }, resolver)
        },
    };
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


`;
}
export default NodeModulesPolyfillPlugin;
//# sourceMappingURL=index.js.map