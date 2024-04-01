import { build } from 'esbuild'
import { writeFiles } from 'test-support'
import fs from 'fs'
import NodeModulesPolyfillsPlugin from '.'
import NodeGlobalsPolyfillsPlugin from '@esbuild-plugins/node-globals-polyfill'

require('debug').enable(require('../package.json').name)

test('works', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import path from 'path'; import { Buffer } from 'buffer'; export const x = path.resolve(Buffer.from('x').toString());`,
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin()],
    })
    eval(res.outputFiles[0].text)
    // console.log(res.outputFiles[0].text)
    unlink()
})

test('works with SafeBuffer and other package consumers', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `import {Buffer as SafeBuffer} from './safe-buffer'; console.log(SafeBuffer);`,
        'safe-buffer.ts': fs
            .readFileSync(require.resolve('safe-buffer'))
            .toString(),
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin()],
    })
    // console.log(
    //     res.outputFiles[0].text
    //         .split('\n')
    //         .map((x, i) => i + ' ' + x)
    //         .join('\n'),
    // )
    eval(res.outputFiles[0].text)
    unlink()
})

test('events works', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `
        import EventEmitter from 'events';

        class Test extends EventEmitter {
            constructor() { };
        }
        console.log(Test)
        `,
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin()],
    })
    // console.log(res.outputFiles[0].text)
    eval(res.outputFiles[0].text)
    unlink()
})

test('require can use default export', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `
        const assert = require('assert')
        // console.log(assert)
        assert('ok')
        `,
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin()],
    })
    // console.log(res.outputFiles[0].text)
    eval(res.outputFiles[0].text)
    unlink()
})

test.skip('crypto', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `import { randomBytes } from 'crypto'; console.log(randomBytes(20).toString('hex'))`,
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin()],
    })
    eval(res.outputFiles[0].text)
    // console.log(res.outputFiles[0].text)
    unlink()
})
test.skip('fs', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `import { readFile } from 'fs'; console.log(readFile(''))`,
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin()],
    })
    eval(res.outputFiles[0].text)
    // console.log(res.outputFiles[0].text)
    unlink()
})

test('does not include global keyword', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import path from 'path'; import { Buffer } from 'buffer'; export const x = path.resolve(Buffer.from('x').toString());`,
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin()],
    })
    const text = res.outputFiles[0].text
    eval(text)
    expect(text).not.toContain(/\bglobal\b/)
    // console.log(res.outputFiles[0].text)
    unlink()
})

test('works with globals polyfills', async () => {
    const {
        unlink,
        paths: [ENTRY],
    } = await writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import path from 'path'; import { Buffer } from 'buffer'; export const x = path.resolve(Buffer.from('x').toString());`,
    })
    // const outfile = randomOutputFile()
    const res = await build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [NodeModulesPolyfillsPlugin(), NodeGlobalsPolyfillsPlugin()],
    })
    const text = res.outputFiles[0].text
    eval(text)
    console.log(text)
    // console.log(res.outputFiles[0].text)
    unlink()
})
