"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_reader_1 = require("../base/hash-reader");
const hash_fn_1 = require("../base/hash-fn");
/**
 * A hash reader for WebAssembly targets.
 */
class NodeHashReader extends hash_reader_1.BaseHashReader {
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
        return this.read(hash_fn_1.defaultHashLength);
    }
    alloc(bytes) {
        return Buffer.alloc(bytes);
    }
}
exports.NodeHashReader = NodeHashReader;
//# sourceMappingURL=hash-reader.js.map