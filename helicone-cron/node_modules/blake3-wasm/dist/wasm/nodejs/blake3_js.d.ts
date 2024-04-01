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
