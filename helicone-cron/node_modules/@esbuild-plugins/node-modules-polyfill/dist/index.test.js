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
const esbuild_1 = require("esbuild");
const test_support_1 = require("test-support");
const fs_1 = __importDefault(require("fs"));
const _1 = __importDefault(require("."));
const node_globals_polyfill_1 = __importDefault(require("@esbuild-plugins/node-globals-polyfill"));
require('debug').enable(require('../package.json').name);
test('works', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import path from 'path'; import { Buffer } from 'buffer'; export const x = path.resolve(Buffer.from('x').toString());`,
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default()],
    });
    eval(res.outputFiles[0].text);
    // console.log(res.outputFiles[0].text)
    unlink();
}));
test('works with SafeBuffer and other package consumers', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {Buffer as SafeBuffer} from './safe-buffer'; console.log(SafeBuffer);`,
        'safe-buffer.ts': fs_1.default
            .readFileSync(require.resolve('safe-buffer'))
            .toString(),
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default()],
    });
    // console.log(
    //     res.outputFiles[0].text
    //         .split('\n')
    //         .map((x, i) => i + ' ' + x)
    //         .join('\n'),
    // )
    eval(res.outputFiles[0].text);
    unlink();
}));
test('events works', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `
        import EventEmitter from 'events';

        class Test extends EventEmitter {
            constructor() { };
        }
        console.log(Test)
        `,
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default()],
    });
    // console.log(res.outputFiles[0].text)
    eval(res.outputFiles[0].text);
    unlink();
}));
test('require can use default export', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `
        const assert = require('assert')
        // console.log(assert)
        assert('ok')
        `,
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default()],
    });
    // console.log(res.outputFiles[0].text)
    eval(res.outputFiles[0].text);
    unlink();
}));
test.skip('crypto', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import { randomBytes } from 'crypto'; console.log(randomBytes(20).toString('hex'))`,
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default()],
    });
    eval(res.outputFiles[0].text);
    // console.log(res.outputFiles[0].text)
    unlink();
}));
test.skip('fs', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import { readFile } from 'fs'; console.log(readFile(''))`,
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default()],
    });
    eval(res.outputFiles[0].text);
    // console.log(res.outputFiles[0].text)
    unlink();
}));
test('does not include global keyword', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import path from 'path'; import { Buffer } from 'buffer'; export const x = path.resolve(Buffer.from('x').toString());`,
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default()],
    });
    const text = res.outputFiles[0].text;
    eval(text);
    expect(text).not.toContain(/\bglobal\b/);
    // console.log(res.outputFiles[0].text)
    unlink();
}));
test('works with globals polyfills', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import path from 'path'; import { Buffer } from 'buffer'; export const x = path.resolve(Buffer.from('x').toString());`,
    });
    // const outfile = randomOutputFile()
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.default(), node_globals_polyfill_1.default()],
    });
    const text = res.outputFiles[0].text;
    eval(text);
    console.log(text);
    // console.log(res.outputFiles[0].text)
    unlink();
}));
//# sourceMappingURL=index.test.js.map