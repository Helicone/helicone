"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encoding_1 = require("./encoding");
/**
 * Hash returned from functions in the browser.
 */
class Hash extends Uint8Array {
    /**
     * A constant-time comparison against the other hash/array.
     */
    equals(other) {
        if (!(other instanceof Uint8Array)) {
            return false;
        }
        if (other.length !== this.length) {
            return false;
        }
        let cmp = 0;
        for (let i = 0; i < this.length; i++) {
            cmp |= this[i] ^ other[i];
        }
        return cmp === 0;
    }
    toString(encoding = 'hex') {
        return encoding_1.mustGetEncoder(encoding)(this);
    }
}
exports.Hash = Hash;
//# sourceMappingURL=hash.js.map