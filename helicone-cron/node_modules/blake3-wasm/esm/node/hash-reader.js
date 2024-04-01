import { BaseHashReader } from '../base/hash-reader.js';
import { defaultHashLength } from '../base/hash-fn.js';
/**
 * A hash reader for WebAssembly targets.
 */
export class NodeHashReader extends BaseHashReader {
    /**
     * Converts first 32 bytes of the hash to a string with the given encoding.
     */
    toString(encoding = 'hex') {
        return this.toBuffer().toString(encoding);
    }
    /**
     * Converts first 32 bytes of the hash to an array.
     */
    toBuffer() {
        this.position = BigInt(0);
        return this.read(defaultHashLength);
    }
    alloc(bytes) {
        return Buffer.alloc(bytes);
    }
}
//# sourceMappingURL=hash-reader.js.map