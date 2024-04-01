"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeGlobalsPolyfillPlugin = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function NodeGlobalsPolyfillPlugin({ buffer = false, define = {}, process = true, } = {}) {
    return {
        name: 'node-globals-polyfill',
        setup({ initialOptions, onResolve, onLoad }) {
            onResolve({ filter: /_node-buffer-polyfill_\.js/ }, (arg) => {
                return {
                    path: path_1.default.resolve(__dirname, '../Buffer.js'),
                };
            });
            onResolve({ filter: /_node-process-polyfill_\.js/ }, (arg) => {
                return {
                    path: path_1.default.resolve(__dirname, '../process.js'),
                };
            });
            onLoad({ filter: /_virtual-process-polyfill_\.js/ }, (arg) => {
                const data = fs_1.default
                    .readFileSync(path_1.default.resolve(__dirname, '../process.js'))
                    .toString();
                const keys = Object.keys(define);
                return {
                    loader: 'js',
                    contents: data.replace(`const defines = {}`, 'const defines = {\n' +
                        keys
                            .filter((x) => x.startsWith('process.'))
                            .sort((a, b) => a.length - b.length)
                            .map((k) => `  ${JSON.stringify(k).replace('process.', '')}: ${define[k]},`)
                            .join('\n') +
                        '\n}'),
                };
            });
            const polyfills = [];
            if (process) {
                polyfills.push(path_1.default.resolve(__dirname, '../_virtual-process-polyfill_.js'));
            }
            if (buffer) {
                polyfills.push(path_1.default.resolve(__dirname, '../_buffer.js'));
            }
            if (initialOptions.inject) {
                initialOptions.inject.push(...polyfills);
            }
            else {
                initialOptions.inject = [...polyfills];
            }
        },
    };
}
exports.NodeGlobalsPolyfillPlugin = NodeGlobalsPolyfillPlugin;
exports.default = NodeGlobalsPolyfillPlugin;
//# sourceMappingURL=index.js.map