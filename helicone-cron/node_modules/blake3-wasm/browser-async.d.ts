import * as blake3 from './esm/browser';

/**
 * Manually loads the WebAssembly module, returning a promise that resolves
 * to the BLAKE3 implementation once available.
 */
export default function load(module: string | URL | Request | object): Promise<typeof blake3>;
