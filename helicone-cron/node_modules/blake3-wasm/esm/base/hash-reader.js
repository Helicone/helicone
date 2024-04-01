/**
 * The maximum number of bytes that can be read from the hash.
 *
 * Calculated out 2^64-1, since `Xn` syntax (for `Xn ** Yn`) requires TS
 * targeting esnext/es2020 which includes features that Node 10 doesn't
 * yet supported.
 */
export const maxHashBytes = BigInt('18446744073709551615');
/**
 * Base hash reader implementation.
 */
export class BaseHashReader {
    constructor(reader) {
        this.pos = BigInt(0);
        this.reader = reader;
    }
    get position() {
        return this.pos;
    }
    set position(value) {
        var _a;
        // to avoid footguns of people using numbers:
        if (typeof value !== 'bigint') {
            throw new Error(`Got a ${typeof value} set in to reader.position, expected a bigint`);
        }
        this.boundsCheck(value);
        this.pos = value;
        (_a = this.reader) === null || _a === void 0 ? void 0 : _a.set_position(value);
    }
    /**
     * @inheritdoc
     */
    readInto(target) {
        if (!this.reader) {
            throw new Error(`Cannot read from a hash after it was disposed`);
        }
        const next = this.pos + BigInt(target.length);
        this.boundsCheck(next);
        this.reader.fill(target);
        this.position = next;
    }
    /**
     * @inheritdoc
     */
    read(bytes) {
        const data = this.alloc(bytes);
        this.readInto(data);
        return data;
    }
    /**
     * @inheritdoc
     */
    dispose() {
        var _a, _b;
        (_b = (_a = this.reader) === null || _a === void 0 ? void 0 : _a.free) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.reader = undefined;
    }
    boundsCheck(position) {
        if (position > maxHashBytes) {
            throw new RangeError(`Cannot read past ${maxHashBytes} bytes in BLAKE3 hashes`);
        }
        if (position < BigInt(0)) {
            throw new RangeError(`Cannot read to a negative position`);
        }
    }
}
//# sourceMappingURL=hash-reader.js.map