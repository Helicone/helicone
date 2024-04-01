/// <reference types="node" />
import { INativeReader } from './native';
import { NodeHash } from '../node/hash-instance';
/**
 * A Node.js crypto-like createHash method.
 */
export declare const createHash: () => NodeHash<INativeReader>;
/**
 * Construct a new Hasher for the keyed hash function.
 */
export declare const createKeyed: (key: Buffer) => NodeHash<INativeReader>;
/**
 * Construct a new Hasher for the key derivation function.
 */
export declare const createDeriveKey: (context: string) => NodeHash<INativeReader>;
