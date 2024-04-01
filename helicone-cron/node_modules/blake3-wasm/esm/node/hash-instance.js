import { normalizeInput } from './hash-fn.js';
import { BaseHash } from '../base/index.js';
import { Transform } from 'stream.js';
import { getWasm } from './wasm.js';
import { NodeHashReader } from './hash-reader.js';
/**
 * @inheritdoc
 */
export class NodeHash extends Transform {
    constructor(implementation, getReader) {
        super();
        this.hash = new BaseHash(implementation, l => Buffer.alloc(l), getReader);
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
        this.hash.update(normalizeInput(data, encoding));
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
/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new NodeHash(getWasm().create_hasher(), r => new NodeHashReader(r));
/**
 * Construct a new Hasher for the keyed hash function.
 */
export const createKeyed = (key) => new NodeHash(getWasm().create_keyed(key), r => new NodeHashReader(r));
/**
 * Construct a new Hasher for the key derivation function.
 */
export const createDeriveKey = (context) => new NodeHash(getWasm().create_derive(context), r => new NodeHashReader(r));
//# sourceMappingURL=hash-instance.js.map