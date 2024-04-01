"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_fn_1 = require("../base/hash-fn");
const blake3_js_1 = require("../../dist/wasm/nodejs/blake3_js");
/**
 * @hidden
 */
exports.normalizeInput = (input, encoding) => hash_fn_1.inputToArray(typeof input === 'string' ? Buffer.from(input, encoding) : input);
/**
 * Returns a blake3 hash of the input, returning the binary hash data.
 */
function hash(input, { length = hash_fn_1.defaultHashLength } = {}) {
    const result = Buffer.alloc(length);
    blake3_js_1.hash(exports.normalizeInput(input), result);
    return result;
}
exports.hash = hash;
/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
function deriveKey(context, material, { length = hash_fn_1.defaultHashLength } = {}) {
    const derive = blake3_js_1.create_derive(context);
    derive.update(exports.normalizeInput(material));
    const result = Buffer.alloc(length);
    derive.digest(result);
    return result;
}
exports.deriveKey = deriveKey;
/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
function keyedHash(key, input, { length = hash_fn_1.defaultHashLength } = {}) {
    if (key.length !== 32) {
        throw new Error(`key provided to keyedHash must be 32 bytes, got ${key.length}`);
    }
    const derive = blake3_js_1.create_keyed(key);
    derive.update(exports.normalizeInput(input));
    const result = Buffer.alloc(length);
    derive.digest(result);
    return result;
}
exports.keyedHash = keyedHash;
//# sourceMappingURL=hash-fn.js.map