"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../base/index");
const hash_fn_1 = require("./hash-fn");
const encoding_1 = require("./encoding");
const hash_reader_1 = require("./hash-reader");
const hash_1 = require("./hash");
const wasm_1 = require("./wasm");
/**
 * @inheritdoc
 */
class BrowserHasher extends index_1.BaseHash {
    /**
     * @inheritdoc
     * @override
     */
    update(data) {
        return super.update(hash_fn_1.normalizeInput(data));
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
        const result = super.digest(resolvedOpts);
        return resolvedEnc ? encoding_1.mustGetEncoder(resolvedEnc)(result) : result;
    }
}
exports.BrowserHasher = BrowserHasher;
/**
 * A Node.js crypto-like createHash method.
 */
exports.createHash = () => new BrowserHasher(wasm_1.getWasm().create_hasher(), l => new hash_1.Hash(l), r => new hash_reader_1.BrowserHashReader(r));
/**
 * A Node.js crypto-like createHash method.
 */
exports.createKeyed = (key) => new BrowserHasher(wasm_1.getWasm().create_keyed(key), l => new hash_1.Hash(l), r => new hash_reader_1.BrowserHashReader(r));
//# sourceMappingURL=hash-instance.js.map