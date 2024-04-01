"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const native_1 = __importDefault(require("./native"));
const hash_instance_1 = require("../node/hash-instance");
const hash_reader_1 = require("../node/hash-reader");
// A buffer we reuse for sending bigints. set_position is synchronous, so
// this just saves creating garbage.
const bigIntBuffer = Buffer.alloc(8);
const readerFactory = (r) => new hash_reader_1.NodeHashReader({
    fill: target => r.fill(target),
    set_position: position => {
        bigIntBuffer.writeBigUInt64BE(position);
        r.set_position(bigIntBuffer);
    },
});
/**
 * A Node.js crypto-like createHash method.
 */
exports.createHash = () => new hash_instance_1.NodeHash(new native_1.default.Hasher(), readerFactory);
/**
 * Construct a new Hasher for the keyed hash function.
 */
exports.createKeyed = (key) => new hash_instance_1.NodeHash(new native_1.default.Hasher(key), readerFactory);
/**
 * Construct a new Hasher for the key derivation function.
 */
exports.createDeriveKey = (context) => new hash_instance_1.NodeHash(new native_1.default.Hasher(undefined, context), readerFactory);
//# sourceMappingURL=hash-instance.js.map