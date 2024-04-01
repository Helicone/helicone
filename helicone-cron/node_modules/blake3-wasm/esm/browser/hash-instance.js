import { BaseHash as BaseHasher } from '../base/index.js';
import { normalizeInput } from './hash-fn.js';
import { mustGetEncoder } from './encoding.js';
import { BrowserHashReader } from './hash-reader.js';
import { Hash } from './hash.js';
import { getWasm } from './wasm.js';
/**
 * @inheritdoc
 */
export class BrowserHasher extends BaseHasher {
    /**
     * @inheritdoc
     * @override
     */
    update(data) {
        return super.update(normalizeInput(data));
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
        return resolvedEnc ? mustGetEncoder(resolvedEnc)(result) : result;
    }
}
/**
 * A Node.js crypto-like createHash method.
 */
export const createHash = () => new BrowserHasher(getWasm().create_hasher(), l => new Hash(l), r => new BrowserHashReader(r));
/**
 * A Node.js crypto-like createHash method.
 */
export const createKeyed = (key) => new BrowserHasher(getWasm().create_keyed(key), l => new Hash(l), r => new BrowserHashReader(r));
//# sourceMappingURL=hash-instance.js.map