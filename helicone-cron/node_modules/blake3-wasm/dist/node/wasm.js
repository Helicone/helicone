"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let w;
/**
 * Lazyily get the WebAssembly module. Used to avoid unnecessarily importing
 * the wasm when extending the WebAssembly node code for native bindings.
 */
exports.getWasm = () => {
    if (!w) {
        w = require('../../dist/wasm/nodejs/blake3_js');
    }
    return w;
};
//# sourceMappingURL=wasm.js.map