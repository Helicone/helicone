import * as rawWasm from '../../dist/wasm/browser/blake3_js';
/**
 * Gets the webassembly module provided in provideWasm.
 */
export declare const getWasm: () => typeof rawWasm;
/**
 * Sets the webassembly module used for the browser build. This indirection is
 * needed to provide compatibility between the "browser" and "browser-async" modes.
 */
export declare const provideWasm: (w: typeof rawWasm) => void;
