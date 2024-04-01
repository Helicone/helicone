import { provideWasm } from './esm/browser/wasm.js';
import * as wasm from './dist/wasm/web/blake3_js.js';
import * as blake3 from './esm/browser/index.js';

let cached;

/**
 * Manually loads the WebAssembly module, returning a promise that resolves
 * to the BLAKE3 implementation once available.
 */
export default function load(module) {
  if (!cached) {
    cached = wasm.default(module).then(() => {
      provideWasm(wasm);
      return blake3;
    });
  }

  return cached;
}
