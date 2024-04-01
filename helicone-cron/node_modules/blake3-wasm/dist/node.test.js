"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const wasm = __importStar(require("./node"));
const native = __importStar(require("./node-native"));
const chai_1 = require("chai");
const test_helpers_1 = require("./base/test-helpers");
const stream_buffers_1 = require("stream-buffers");
const hash_reader_1 = require("./base/hash-reader");
function suite({ hash, createHash, keyedHash, deriveKey, createDeriveKey, createKeyed, }) {
    describe('encoding', () => {
        it('hashes a buffer', () => {
            chai_1.expect(hash(Buffer.from(test_helpers_1.inputs.hello.input))).to.deep.equal(test_helpers_1.inputs.hello.hash);
        });
        it('hashes a string', () => {
            chai_1.expect(hash(test_helpers_1.inputs.hello.input)).to.deep.equal(test_helpers_1.inputs.hello.hash);
        });
        it('hashes an arraybuffer', () => {
            const buf = Buffer.from(test_helpers_1.inputs.hello.input);
            chai_1.expect(hash(new Uint8Array(buf).buffer)).to.deep.equal(test_helpers_1.inputs.hello.hash);
        });
        it('customizes the output length', () => {
            chai_1.expect(hash(test_helpers_1.inputs.hello.input, { length: 16 })).to.deep.equal(test_helpers_1.inputs.hello.hash.slice(0, 16));
        });
    });
    describe('memory-safety (#5)', () => {
        it('hash', () => {
            const hashA = hash('hello');
            const hashB = hash('goodbye');
            chai_1.expect(hashA.toString('hex')).to.equal('ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f');
            chai_1.expect(hashB.toString('hex')).to.equal('f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69');
        });
        it('hasher', () => {
            const hasherA = createHash();
            const hasherB = createHash();
            hasherA.update('hel');
            hasherB.update('good');
            hasherA.update('lo');
            hasherB.update('bye');
            const hashA = hasherA.digest();
            const hashB = hasherB.digest();
            chai_1.expect(hashA.toString('hex')).to.equal('ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f');
            chai_1.expect(hashB.toString('hex')).to.equal('f94a694227c5f31a07551908ad5fb252f5f0964030df5f2f200adedfae4d9b69');
        });
    });
    describe('hasher', () => {
        it('digests', callback => {
            const buffer = new stream_buffers_1.ReadableStreamBuffer();
            buffer.put(Buffer.from(test_helpers_1.inputs.large.input));
            buffer.stop();
            const hash = createHash();
            buffer.on('data', b => hash.update(b));
            buffer.on('end', () => {
                const actual = hash.digest();
                chai_1.expect(actual).to.deep.equal(test_helpers_1.inputs.large.hash);
                callback();
            });
        });
        it('is a transform stream', callback => {
            const buffer = new stream_buffers_1.ReadableStreamBuffer();
            buffer.put(Buffer.from(test_helpers_1.inputs.large.input));
            buffer.stop();
            buffer
                .pipe(createHash())
                .on('error', callback)
                .on('data', hash => {
                chai_1.expect(hash).to.deep.equal(test_helpers_1.inputs.large.hash);
                callback();
            });
        });
        it('customizes the output length', () => {
            const hash = createHash();
            hash.update(test_helpers_1.inputs.hello.input);
            chai_1.expect(hash.digest('hex', { length: 16 })).to.equal(test_helpers_1.inputs.hello.hash.slice(0, 16).toString('hex'));
        });
        it('throws on write after dispose', () => {
            const hash = createHash();
            hash.dispose();
            chai_1.expect(() => hash.update('')).to.throw(/after dispose/);
        });
        it('allows taking incremental hashes', () => {
            const hasher = createHash();
            hasher.update('hel');
            const hashA = hasher.digest(undefined, { dispose: false });
            const readA = hasher.reader({ dispose: false });
            hasher.update('lo');
            const hashB = hasher.digest(undefined, { dispose: false });
            const readB = hasher.reader({ dispose: false });
            const expectedA = Buffer.from('3121c5bb1b9193123447ac7cfda042f67f967e7a8cf5c12e7570e25529746e4a', 'hex');
            chai_1.expect(hashA).to.deep.equal(expectedA);
            chai_1.expect(readA.toBuffer()).to.deep.equal(expectedA);
            chai_1.expect(hashB).to.deep.equal(test_helpers_1.inputs.hello.hash);
            chai_1.expect(readB.toBuffer()).to.deep.equal(test_helpers_1.inputs.hello.hash);
            hasher.dispose();
            readA.dispose();
            readB.dispose();
        });
    });
    describe('reader', () => {
        let reader;
        beforeEach(() => {
            const hash = createHash();
            hash.update(test_helpers_1.inputs.hello.input);
            reader = hash.reader();
        });
        afterEach(() => reader.dispose());
        it('implements toString()', () => {
            chai_1.expect(reader.toString('hex')).to.equal(test_helpers_1.inputs.hello.hash.toString('hex'));
            reader.position = BigInt(42);
            chai_1.expect(reader.toString('hex')).to.equal(test_helpers_1.inputs.hello.hash.toString('hex'));
        });
        it('implements toBuffer()', () => {
            chai_1.expect(reader.toBuffer()).to.deep.equal(test_helpers_1.inputs.hello.hash);
            reader.position = BigInt(42);
            chai_1.expect(reader.toBuffer()).to.deep.equal(test_helpers_1.inputs.hello.hash);
        });
        it('implements readInto() and advances', () => {
            const actual = Buffer.alloc(32);
            reader.readInto(actual.slice(0, 10));
            reader.readInto(actual.slice(10));
            chai_1.expect(actual).to.deep.equal(test_helpers_1.inputs.hello.hash);
            chai_1.expect(reader.position).to.equal(BigInt(32));
        });
        it('implements read() and advances', () => {
            const actual = reader.read(32);
            chai_1.expect(actual).to.deep.equal(test_helpers_1.inputs.hello.hash);
            chai_1.expect(reader.position).to.equal(BigInt(32));
            const actualNext = reader.read(16);
            chai_1.expect(actualNext).to.deep.equal(test_helpers_1.hello48.slice(32));
            chai_1.expect(reader.position).to.equal(BigInt(48));
        });
        it('manually sets position', () => {
            reader.position = BigInt(32);
            const actual = reader.read(16);
            chai_1.expect(actual).to.deep.equal(test_helpers_1.hello48.slice(32));
        });
        it('throws if set out of range', () => {
            chai_1.expect(() => (reader.position = BigInt(-1))).to.throw(RangeError);
            chai_1.expect(() => (reader.position = BigInt('18446744073709551616'))).to.throw(RangeError);
            reader.position = hash_reader_1.maxHashBytes - BigInt(1);
            chai_1.expect(() => reader.read(2)).to.throw(RangeError);
        });
    });
    describe('original test vectors', () => {
        for (const { inputLen, expectedDerive, expectedKeyed, expectedHash } of test_helpers_1.ogTestVectors.cases) {
            describe(`${inputLen}`, () => __awaiter(this, void 0, void 0, function* () {
                const input = Buffer.alloc(inputLen);
                for (let i = 0; i < inputLen; i++) {
                    input[i] = i % 251;
                }
                it('hash()', () => {
                    chai_1.expect(hash(input, { length: expectedHash.length / 2 }).toString('hex')).to.equal(expectedHash);
                });
                it('deriveKey()', () => {
                    chai_1.expect(deriveKey(test_helpers_1.ogTestVectors.context, input, { length: expectedDerive.length / 2 }).toString('hex')).to.equal(expectedDerive);
                });
                it('createDeriveKey()', callback => {
                    const buffer = new stream_buffers_1.ReadableStreamBuffer();
                    buffer.put(Buffer.from(input));
                    buffer.stop();
                    const hash = createDeriveKey(test_helpers_1.ogTestVectors.context);
                    buffer.on('data', b => hash.update(b));
                    buffer.on('end', () => {
                        const actual = hash.digest({ length: expectedDerive.length / 2 }).toString('hex');
                        chai_1.expect(actual).to.equal(expectedDerive);
                        callback();
                    });
                });
                it('keyedHash()', () => {
                    chai_1.expect(keyedHash(Buffer.from(test_helpers_1.ogTestVectors.key), input, {
                        length: expectedKeyed.length / 2,
                    }).toString('hex')).to.equal(expectedKeyed);
                });
                it('createKeyed()', callback => {
                    const buffer = new stream_buffers_1.ReadableStreamBuffer();
                    buffer.put(Buffer.from(input));
                    buffer.stop();
                    const hash = createKeyed(Buffer.from(test_helpers_1.ogTestVectors.key));
                    buffer.on('data', b => hash.update(b));
                    buffer.on('end', () => {
                        const actual = hash.digest({ length: expectedDerive.length / 2 }).toString('hex');
                        chai_1.expect(actual).to.equal(expectedKeyed);
                        callback();
                    });
                });
            }));
        }
    });
}
describe('node.js wasm', () => suite(wasm));
describe('node.js native', () => suite(native));
//# sourceMappingURL=node.test.js.map