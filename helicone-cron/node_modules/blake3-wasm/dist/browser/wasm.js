"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let wasm;
/**
 * Gets the webassembly module provided in provideWasm.
 */
exports.getWasm = () => {
    if (!wasm) {
        throw new Error('BLAKE3 webassembly not loaded. Please import the module via `blake3/browser` or `blake3/browser-async`');
    }
    return wasm;
};
/**
 * Sets the webassembly module used for the browser build. This indirection is
 * needed to provide compatibility between the "browser" and "browser-async" modes.
 */
exports.provideWasm = (w) => {
    wasm = w;
};
//# sourceMappingURL=wasm.js.map