import inject from 'rollup-plugin-inject';
import { dirname, relative } from 'path';
import { randomBytes } from 'crypto';

const EMPTY_PATH = require.resolve('../polyfills/empty.js');
function builtinsResolver(opts) {
    const libs = new Map();
    libs.set('process', require.resolve('../polyfills/process-es6'));
    libs.set('buffer', require.resolve('../polyfills/buffer-es6'));
    libs.set('util', require.resolve('../polyfills/util'));
    libs.set('sys', libs.get('util'));
    libs.set('events', require.resolve('../polyfills/events'));
    libs.set('stream', require.resolve('../polyfills/stream'));
    libs.set('path', require.resolve('../polyfills/path'));
    libs.set('querystring', require.resolve('../polyfills/qs'));
    libs.set('punycode', require.resolve('../polyfills/punycode'));
    libs.set('url', require.resolve('../polyfills/url'));
    libs.set('string_decoder', require.resolve('../polyfills/string-decoder'));
    libs.set('http', require.resolve('../polyfills/http'));
    libs.set('https', require.resolve('../polyfills/http'));
    libs.set('os', require.resolve('../polyfills/os'));
    libs.set('assert', require.resolve('../polyfills/assert'));
    libs.set('constants', require.resolve('../polyfills/constants'));
    libs.set('_stream_duplex', require.resolve('../polyfills/readable-stream/duplex'));
    libs.set('_stream_passthrough', require.resolve('../polyfills/readable-stream/passthrough'));
    libs.set('_stream_readable', require.resolve('../polyfills/readable-stream/readable'));
    libs.set('_stream_writable', require.resolve('../polyfills/readable-stream/writable'));
    libs.set('_stream_transform', require.resolve('../polyfills/readable-stream/transform'));
    libs.set('timers', require.resolve('../polyfills/timers'));
    libs.set('console', require.resolve('../polyfills/console'));
    libs.set('vm', require.resolve('../polyfills/vm'));
    libs.set('zlib', require.resolve('../polyfills/zlib'));
    libs.set('tty', require.resolve('../polyfills/tty'));
    libs.set('domain', require.resolve('../polyfills/domain'));
    // not shimmed
    libs.set('dns', EMPTY_PATH);
    libs.set('dgram', EMPTY_PATH);
    libs.set('child_process', EMPTY_PATH);
    libs.set('cluster', EMPTY_PATH);
    libs.set('module', EMPTY_PATH);
    libs.set('net', EMPTY_PATH);
    libs.set('readline', EMPTY_PATH);
    libs.set('repl', EMPTY_PATH);
    libs.set('tls', EMPTY_PATH);
    libs.set('fs', EMPTY_PATH);
    libs.set('crypto', EMPTY_PATH);
    if (opts.fs) {
        libs.set('fs', require.resolve('../polyfills/browserify-fs'));
    }
    if (opts.crypto) {
        libs.set('crypto', require.resolve('../polyfills/crypto-browserify'));
    }
    return (importee) => {
        if (importee && importee.slice(-1) === '/') {
            importee === importee.slice(0, -1);
        }
        if (libs.has(importee)) {
            return { id: libs.get(importee), moduleSideEffects: false };
        }
        return null;
    };
}

// @ts-ignore
function index (opts = {}) {
    const injectPlugin = inject({
        include: opts.include === undefined ? 'node_modules/**/*.js' : undefined,
        exclude: opts.exclude,
        sourceMap: opts.sourceMap,
        modules: {
            'process': 'process',
            'Buffer': ['buffer', 'Buffer'],
            'global': GLOBAL_PATH,
            '__filename': FILENAME_PATH,
            '__dirname': DIRNAME_PATH,
        }
    });
    const basedir = opts.baseDir || '/';
    const dirs = new Map();
    const resolver = builtinsResolver(opts);
    return {
        name: 'node-polyfills',
        resolveId(importee, importer) {
            if (importee === DIRNAME_PATH) {
                const id = getRandomId();
                dirs.set(id, dirname('/' + relative(basedir, importer)));
                return { id, moduleSideEffects: false };
            }
            if (importee === FILENAME_PATH) {
                const id = getRandomId();
                dirs.set(id, dirname('/' + relative(basedir, importer)));
                return { id, moduleSideEffects: false };
            }
            return resolver(importee);
        },
        load(id) {
            if (dirs.has(id)) {
                return `export default '${dirs.get(id)}'`;
            }
        },
        transform(code, id) {
            return injectPlugin.transform.call(this, code, id);
        }
    };
}
function getRandomId() {
    return randomBytes(15).toString('hex');
}
const GLOBAL_PATH = require.resolve('../polyfills/global.js');
const DIRNAME_PATH = '\0node-polyfills:dirname';
const FILENAME_PATH = '\0node-polyfills:filename';

export default index;
