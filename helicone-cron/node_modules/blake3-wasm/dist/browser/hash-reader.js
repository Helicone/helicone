"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_reader_1 = require("../base/hash-reader");
const hash_1 = require("./hash");
const index_1 = require("../base/index");
/**
 * A hash reader for WebAssembly targets.
 */
class BrowserHashReader extends hash_reader_1.BaseHashReader {
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
        return this.read(index_1.defaultHashLength);
    }
    alloc(bytes) {
        return new hash_1.Hash(bytes);
    }
}
exports.BrowserHashReader = BrowserHashReader;
//# sourceMappingURL=hash-reader.js.map