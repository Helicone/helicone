import { mustGetEncoder } from './encoding.js';
/**
 * Hash returned from functions in the browser.
 */
export class Hash extends Uint8Array {
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
        return mustGetEncoder(encoding)(this);
    }
}
//# sourceMappingURL=hash.js.map