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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_1 = require("fs");
const http_1 = require("http");
const os_1 = require("os");
const path_1 = require("path");
const puppeteer_1 = __importDefault(require("puppeteer"));
const serve_handler_1 = __importDefault(require("serve-handler"));
const webpack_1 = __importDefault(require("webpack"));
const test_helpers_1 = require("./base/test-helpers");
// Much of the browser code is also used in Node's wasm. We test things more
// thoroughly there because tests are easier to write and debug, these tests
// are primarily for sanity and checking browser-specific behavior.
describe('browser', () => {
    const addInputs = `window.inputs = ${JSON.stringify(test_helpers_1.inputs)}`;
    describe('webpack', () => {
        const testDir = path_1.resolve(os_1.tmpdir(), 'blake3-browser-test');
        let server;
        let page;
        /**
         * Builds the browser lib into the testDir.
         */
        function buildWebpack() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    fs_1.mkdirSync(testDir);
                }
                catch (_a) {
                    // already exists, probably
                }
                fs_1.writeFileSync(path_1.resolve(testDir, 'entry-src.js'), `import("blake3/browser").then(b3 => window.blake3 = b3);`);
                const stats = yield new Promise((res, rej) => webpack_1.default({
                    mode: 'production',
                    devtool: 'source-map',
                    entry: path_1.resolve(testDir, 'entry-src.js'),
                    output: {
                        path: testDir,
                        filename: 'main.js',
                    },
                    resolve: {
                        alias: {
                            'blake3/browser': path_1.resolve(__dirname, '../', 'browser.js'),
                        },
                    },
                }, (err, stats) => (err ? rej(err) : res(stats))));
                if (stats.hasErrors()) {
                    throw stats.toString('errors-only');
                }
                fs_1.writeFileSync(path_1.resolve(testDir, 'index.html'), `<script src="/main.js"></script>`);
            });
        }
        function serve() {
            return __awaiter(this, void 0, void 0, function* () {
                server = http_1.createServer((req, res) => serve_handler_1.default(req, res, { public: testDir }));
                yield new Promise(resolve => server.listen(0, resolve));
            });
        }
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield buildWebpack();
                yield serve();
                this.timeout(20 * 1000);
                const { port } = server.address();
                const browser = yield puppeteer_1.default.launch({
                    executablePath: 'google-chrome-stable',
                    args: ['--no-sandbox'],
                });
                page = yield browser.newPage();
                yield page.goto(`http://localhost:${port}`);
                yield page.waitForFunction('!!window.blake3');
                yield page.evaluate(addInputs);
            });
        });
        runTests({
            get page() {
                return page;
            },
        });
        after(() => {
            page === null || page === void 0 ? void 0 : page.browser().close();
            server === null || server === void 0 ? void 0 : server.close();
        });
    });
    describe('native browser', () => {
        let server;
        let page;
        function serve() {
            return __awaiter(this, void 0, void 0, function* () {
                server = http_1.createServer((req, res) => serve_handler_1.default(req, res, { public: path_1.resolve(__dirname, '..') }));
                yield new Promise(resolve => server.listen(0, resolve));
            });
        }
        before(function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield serve();
                this.timeout(20 * 1000);
                const { port } = server.address();
                const browser = yield puppeteer_1.default.launch({
                    executablePath: 'google-chrome-stable',
                    args: ['--no-sandbox'],
                });
                page = yield browser.newPage();
                page.on('console', console.log);
                page.on('pageerror', console.log);
                page.on('error', console.log);
                yield page.goto(`http://localhost:${port}/browser-async.test.html`);
                yield page.waitForFunction('!!window.blake3');
                yield page.evaluate(addInputs);
            });
        });
        runTests({
            get page() {
                return page;
            },
        });
        after(() => {
            page === null || page === void 0 ? void 0 : page.browser().close();
            server.close();
        });
    });
});
function runTests(opts) {
    it('hashes a string', () => __awaiter(this, void 0, void 0, function* () {
        const result = yield opts.page.evaluate('blake3.hash(inputs.large.input).toString("hex")');
        chai_1.expect(result).to.equal(test_helpers_1.inputs.large.hash.toString('hex'));
    }));
    describe('input encoding', () => {
        it('hashes a uint8array', () => __awaiter(this, void 0, void 0, function* () {
            const contents = [...new Uint8Array(Buffer.from(test_helpers_1.inputs.hello.input))];
            const result = yield opts.page.evaluate(`blake3.hash(new Uint8Array([${contents.join(',')}])).toString("hex")`);
            chai_1.expect(result).to.equal(test_helpers_1.inputs.hello.hash.toString('hex'));
        }));
        it('hashes a string', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield opts.page.evaluate('blake3.hash(inputs.large.input).toString("hex")');
            chai_1.expect(result).to.equal(test_helpers_1.inputs.large.hash.toString('hex'));
        }));
        it('customizes output length', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield opts.page.evaluate('blake3.hash(inputs.hello.input, { length: 16 }).toString("hex")');
            chai_1.expect(result).to.equal(test_helpers_1.inputs.hello.hash.slice(0, 16).toString('hex'));
        }));
    });
    describe('output encoding', () => {
        const tcases = [
            { encoding: 'hex', expected: test_helpers_1.inputs.hello.hash.toString('hex') },
            { encoding: 'base64', expected: test_helpers_1.inputs.hello.hash.toString('base64') },
            { encoding: 'utf8', expected: test_helpers_1.inputs.hello.hash.toString('utf8') },
        ];
        tcases.forEach(({ encoding, expected }) => it(encoding, () => __awaiter(this, void 0, void 0, function* () {
            const result = yield opts.page.evaluate(`blake3.hash(inputs.hello.input).toString("${encoding}")`);
            chai_1.expect(result).to.equal(expected);
        })));
        it('raw', () => __awaiter(this, void 0, void 0, function* () {
            const result = (yield opts.page.evaluate(`blake3.hash(inputs.hello.input)`));
            const actual = Buffer.alloc(32);
            for (let i = 0; i < actual.length; i++) {
                actual[i] = result[i]; // it comes as a plain object, we need to convert it to a buffer
            }
            chai_1.expect(actual).to.deep.equal(test_helpers_1.inputs.hello.hash);
        }));
    });
    describe('hash class', () => {
        it('digests', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        ${[...Buffer.from(test_helpers_1.inputs.hello.input)]
                .map(byte => `hash.update(new Uint8Array([${byte}]));`)
                .join('\n')}
        return hash.digest('hex');
      })()`);
            chai_1.expect(result).to.equal(test_helpers_1.inputs.hello.hash.toString('hex'));
        }));
        it('customizes the output length', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        hash.update(${JSON.stringify(test_helpers_1.inputs.hello.input)});
        return hash.digest('hex', { length: 16 });
      })()`);
            chai_1.expect(result).to.equal(test_helpers_1.inputs.hello.hash.slice(0, 16).toString('hex'));
        }));
        it('returns a hash instance from digest', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        ${[...Buffer.from(test_helpers_1.inputs.hello.input)]
                .map(byte => `hash.update(new Uint8Array([${byte}]));`)
                .join('\n')}
        return hash.digest('hex');
      })()`);
            chai_1.expect(result).to.equal(test_helpers_1.inputs.hello.hash.toString('hex'));
        }));
    });
    describe('reader', () => {
        it('is sane with a Hash', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield opts.page.evaluate(`(() => {
        const hash = blake3.createHash();
        hash.update("hello");

        return blake3.using(hash.reader(), reader => [
          reader.read(48).toString('hex'),
          reader.toArray().toString('hex'),
          reader.toString('hex'),
        ]);
      })()`);
            chai_1.expect(result).to.deep.equal([
                test_helpers_1.hello48.toString('hex'),
                test_helpers_1.inputs.hello.hash.toString('hex'),
                test_helpers_1.inputs.hello.hash.toString('hex'),
            ]);
        }));
    });
    describe('original test vectors', () => {
        for (const { inputLen, expectedDerive, expectedHash, expectedKeyed, } of test_helpers_1.ogTestVectors.cases.slice(0, 6)) {
            describe(`${inputLen}`, () => __awaiter(this, void 0, void 0, function* () {
                const input = Buffer.alloc(inputLen);
                for (let i = 0; i < inputLen; i++) {
                    input[i] = i % 251;
                }
                const inputStr = `new Uint8Array([${input.join(',')}])`;
                it('hash()', () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield opts.page.evaluate(`blake3.hash(
            ${inputStr},
            { length: ${expectedHash.length / 2} }
          ).toString("hex")`);
                    chai_1.expect(result).to.equal(expectedHash);
                }));
                it('deriveKey()', () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield opts.page.evaluate(`blake3.deriveKey(
            ${JSON.stringify(test_helpers_1.ogTestVectors.context)},
            ${inputStr},
            { length: ${expectedHash.length / 2} }
          ).toString("hex")`);
                    chai_1.expect(result).to.equal(expectedDerive);
                }));
                it('createKeyed()', () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield opts.page.evaluate(`(() => {
            const hasher = blake3.createKeyed(new Uint8Array([${Buffer.from(test_helpers_1.ogTestVectors.key).join(',')}]));
            hasher.update(${inputStr});
            return hasher.digest({ length: ${expectedHash.length / 2} }).toString('hex');
          })()`);
                    chai_1.expect(result).to.equal(expectedKeyed);
                }));
                it('keyedHash()', () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield opts.page.evaluate(`blake3.keyedHash(
            new Uint8Array([${Buffer.from(test_helpers_1.ogTestVectors.key).join(',')}]),
            ${inputStr},
            { length: ${expectedHash.length / 2} }
          ).toString("hex")`);
                    chai_1.expect(result).to.equal(expectedKeyed);
                }));
            }));
        }
    });
}
//# sourceMappingURL=browser.test.js.map