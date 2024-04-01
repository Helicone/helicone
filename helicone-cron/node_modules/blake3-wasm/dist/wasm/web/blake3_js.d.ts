/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} data
* @param {Uint8Array} out
*/
export function hash(data: Uint8Array, out: Uint8Array): void;
/**
* @returns {Blake3Hash}
*/
export function create_hasher(): Blake3Hash;
/**
* @param {Uint8Array} key_slice
* @returns {Blake3Hash}
*/
export function create_keyed(key_slice: Uint8Array): Blake3Hash;
/**
* @param {string} context
* @returns {Blake3Hash}
*/
export function create_derive(context: string): Blake3Hash;
/**
*/
export class Blake3Hash {
  free(): void;
/**
* @returns {HashReader}
*/
  reader(): HashReader;
/**
* @param {Uint8Array} input_bytes
*/
  update(input_bytes: Uint8Array): void;
/**
* @param {Uint8Array} out
*/
  digest(out: Uint8Array): void;
}
/**
*/
export class HashReader {
  free(): void;
/**
* @param {Uint8Array} bytes
*/
  fill(bytes: Uint8Array): void;
/**
* @param {BigInt} position
*/
  set_position(position: BigInt): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly hash: (a: number, b: number, c: number, d: number) => void;
  readonly create_hasher: () => number;
  readonly create_keyed: (a: number, b: number) => number;
  readonly create_derive: (a: number, b: number) => number;
  readonly __wbg_blake3hash_free: (a: number) => void;
  readonly blake3hash_reader: (a: number) => number;
  readonly blake3hash_update: (a: number, b: number, c: number) => void;
  readonly blake3hash_digest: (a: number, b: number, c: number) => void;
  readonly __wbg_hashreader_free: (a: number) => void;
  readonly hashreader_fill: (a: number, b: number, c: number) => void;
  readonly hashreader_set_position: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
        