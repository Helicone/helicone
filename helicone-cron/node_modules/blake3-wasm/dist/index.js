"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// Bunlers add the `process.browser` flag to indicate the build enviroment.
// Throw a verbose error if we see people bundling the Node.js build in their
// browser, since it probably won't work for them (or at least not give them)
// nice tree shaking and such.
//
// Note that we don't check the presence of window/document, since those can
// be emulated in common test scenarios (e.g. jest's default setup with jsdom).
if (process.browser) {
    throw new Error('You tried to import the Node.js version of blake3, instead of the browser ' +
        'version, in your build. You can fix this by importing "blake3/browser" ' +
        'instead of "blake3"');
}
__export(require("./node"));
//# sourceMappingURL=index.js.map