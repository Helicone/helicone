"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const native_1 = __importDefault(require("./native"));
const hash_fn_1 = require("../base/hash-fn");
/**
 * @hidden
 */
exports.normalizeInput = (input, encoding) => {
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
function hash(input, { length = hash_fn_1.defaultHashLength } = {}) {
    return native_1.default.hash(exports.normalizeInput(input), length);
}
exports.hash = hash;
/**
 * Given cryptographic key material  and a context string, services a subkey of
 * any length. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.derive_key.html}
 * for more information.
 */
function deriveKey(context, material, { length = hash_fn_1.defaultHashLength } = {}) {
    const hasher = new native_1.default.Hasher(undefined, context);
    hasher.update(exports.normalizeInput(material));
    const result = Buffer.alloc(length);
    hasher.digest(result);
    return result;
}
exports.deriveKey = deriveKey;
/**
 * The keyed hash function. See {@link https://docs.rs/blake3/0.1.3/blake3/fn.keyed_hash.html}.
 */
function keyedHash(key, input, { length = hash_fn_1.defaultHashLength } = {}) {
    const hasher = new native_1.default.Hasher(key);
    hasher.update(exports.normalizeInput(input));
    const result = Buffer.alloc(length);
    hasher.digest(result);
    return result;
}
exports.keyedHash = keyedHash;
//# sourceMappingURL=hash-fn.js.map