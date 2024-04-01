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
Object.defineProperty(exports, "__esModule", { value: true });
const esbuild_1 = require("esbuild");
const test_support_1 = require("test-support");
const _1 = require(".");
require('debug').enable(require('../package.json').name);
test('process works', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `process.version`,
    });
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        inject: [require.resolve('../process')],
    });
    const output = res.outputFiles[0].text;
    // console.log(output)
    eval(output);
    unlink();
}));
test('process is tree shaken', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `console.log('hei')`,
    });
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        inject: [require.resolve('../process')],
    });
    const output = res.outputFiles[0].text;
    expect(output).not.toContain('process');
    unlink();
}));
test('process env vars are replaced with ones from define', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `if (process.env.VAR !== 'hello') { throw new Error('process.env.VAR not right: ' + process.env.VAR) }`,
    });
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [
            _1.NodeGlobalsPolyfillPlugin({
                define: {
                    'process.env.VAR': '"hello"',
                },
            }),
        ],
    });
    const output = res.outputFiles[0].text;
    eval(output);
    unlink();
}));
test('Buffer works', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `console.log(Buffer.from('xxx').toString())`,
    });
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        inject: [require.resolve('../Buffer')],
    });
    const output = res.outputFiles[0].text;
    // console.log(output)
    eval(output);
    unlink();
}));
test('Buffer is tree shaken', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `console.log('hei')`,
    });
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        inject: [require.resolve('../Buffer')],
    });
    const output = res.outputFiles[0].text;
    expect(output).not.toContain('Buffer');
    unlink();
}));
test('Buffer works using plugin', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `
        let buf = new Buffer(256);
        let len = buf.write("Simply Easy Learning");
        console.log("Octets written : "+  len);`,
    });
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.NodeGlobalsPolyfillPlugin({ buffer: true })],
    });
    const output = res.outputFiles[0].text;
    // console.log(output)
    eval(output);
    unlink();
}));
test('process works using plugin', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `console.log(process.cwd())`,
    });
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [_1.NodeGlobalsPolyfillPlugin({ process: true })],
    });
    const output = res.outputFiles[0].text;
    // console.log(output)
    eval(output);
    unlink();
}));
//# sourceMappingURL=index.test.js.map