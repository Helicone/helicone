import * as wasm from '../../dist/wasm/nodejs/blake3_js';
/**
 * Lazyily get the WebAssembly module. Used to avoid unnecessarily importing
 * the wasm when extending the WebAssembly node code for native bindings.
 */
export declare const getWasm: () => typeof wasm;
