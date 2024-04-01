import native from './native.js';
import { defaultHashLength } from '../base/hash-fn.js';
/**
 * @hidden
 */
export const normalizeInput = (input, encoding) => {
    if (input instanceof Buffer) {
        return input;
    }
    if (typeof input === 'string') {
        return Buffer.from(input, encoding);
    }
    return Buffer.from(input);
};
/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
export function hash(input, { length = defaultHashLength } = {}) {
    return native.hash(normalizeInput(input), length);
}
/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
export function deriveKey(context, material, { length = defaultHashLength } = {}) {
    const hasher = new native.Hasher(undefined, context);
    hasher.update(normalizeInput(material));
    const result = Buffer.alloc(length);
    hasher.digest(result);
    return result;
}
/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
export function keyedHash(key, input, { length = defaultHashLength } = {}) {
    const hasher = new native.Hasher(key);
    hasher.update(normalizeInput(input));
    const result = Buffer.alloc(length);
    hasher.digest(result);
    return result;
}
//# sourceMappingURL=hash-fn.js.map