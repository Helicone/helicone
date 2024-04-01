"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_fn_1 = require("./hash-fn");
const index_1 = require("../base/index");
const stream_1 = require("stream");
const wasm_1 = require("./wasm");
const hash_reader_1 = require("./hash-reader");
/**
 * @inheritdoc
 */
class NodeHash extends stream_1.Transform {
    constructor(implementation, getReader) {
        super();
        this.hash = new index_1.BaseHash(implementation, l => Buffer.alloc(l), getReader);
    }
    /**
     * @reader
     */
    reader(options) {
        const reader = this.hash.reader(options);
        return reader;
    }
    /**
     * @inheritdoc
     */
    update(data, encoding) {
        this.hash.update(hash_fn_1.normalizeInput(data, encoding));
        return this;
    }
    digest(encoding, options) {
        let resolvedOpts;
        let resolvedEnc;
        if (encoding && typeof encoding === 'object') {
            resolvedOpts = encoding;
            resolvedEnc = undefined;
        }
        else {
            resolvedOpts = options;
            resolvedEnc = encoding;
        }
        const result = this.hash.digest(resolvedOpts);
        return resolvedEnc ? result.toString(resolvedEnc) : result;
    }
    /**
     * @inheritdoc
     */
    dispose() {
        this.hash.dispose();
    }
    /**
     * @inheritdoc
     * @hidden
     */
    _transform(chunk, encoding, callback) {
        this.update(chunk, encoding);
        callback();
    }
    /**
     * @inheritdoc
     * @hidden
     */
    _flush(callback) {
        callback(null, this.digest());
    }
}
exports.NodeHash = NodeHash;
/**
 * A Node.js crypto-like createHash method.
 */
exports.createHash = () => new NodeHash(wasm_1.getWasm().create_hasher(), r => new hash_reader_1.NodeHashReader(r));
/**
 * Construct a new Hasher for the keyed hash function.
 */
exports.createKeyed = (key) => new NodeHash(wasm_1.getWasm().create_keyed(key), r => new hash_reader_1.NodeHashReader(r));
/**
 * Construct a new Hasher for the key derivation function.
 */
exports.createDeriveKey = (context) => new NodeHash(wasm_1.getWasm().create_derive(context), r => new hash_reader_1.NodeHashReader(r));
//# sourceMappingURL=hash-instance.js.map