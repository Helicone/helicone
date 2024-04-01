import { BaseHashReader } from '../base/hash-reader.js';
import { Hash } from './hash.js';
import { defaultHashLength } from '../base/index.js';
/**
 * A hash reader for WebAssembly targets.
 */
export class BrowserHashReader extends BaseHashReader {
    /**
     * Converts first 32 bytes of the hash to a string with the given encoding.
     */
    toString(encoding = 'hex') {
        return this.toArray().toString(encoding);
    }
    /**
     * Converts first 32 bytes of the hash to an array.
     */
    toArray() {
        this.position = BigInt(0);
        return this.read(defaultHashLength);
    }
    alloc(bytes) {
        return new Hash(bytes);
    }
}
//# sourceMappingURL=hash-reader.js.map