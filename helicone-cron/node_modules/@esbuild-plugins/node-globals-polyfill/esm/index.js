import path from 'path';
import fs from 'fs';
export function NodeGlobalsPolyfillPlugin({ buffer = false, define = {}, process = true, } = {}) {
    return {
        name: 'node-globals-polyfill',
        setup({ initialOptions, onResolve, onLoad }) {
            onResolve({ filter: /_node-buffer-polyfill_\.js/ }, (arg) => {
                return {
                    path: path.resolve(__dirname, '../Buffer.js'),
                };
            });
            onResolve({ filter: /_node-process-polyfill_\.js/ }, (arg) => {
                return {
                    path: path.resolve(__dirname, '../process.js'),
                };
            });
            onLoad({ filter: /_virtual-process-polyfill_\.js/ }, (arg) => {
                const data = fs
                    .readFileSync(path.resolve(__dirname, '../process.js'))
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
                polyfills.push(path.resolve(__dirname, '../_virtual-process-polyfill_.js'));
            }
            if (buffer) {
                polyfills.push(path.resolve(__dirname, '../_buffer.js'));
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
export default NodeGlobalsPolyfillPlugin;
//# sourceMappingURL=index.js.map