"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Script that adds .js extension to imports so that it's compatible with plain
 * browser/non-webpack bundlers. TS doesn't support this natively yet.
 * @see https://github.com/microsoft/TypeScript/issues/16577
 */
function processFile(file) {
    let source = fs_1.readFileSync(file, 'utf-8');
    const program = ts.createSourceFile(path_1.basename(file), source, ts.ScriptTarget.ES2015, true);
    let offset = 0;
    const process = (node) => {
        if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier) {
            return ts.forEachChild(node, process);
        }
        const specifier = node.moduleSpecifier;
        if (path_1.extname(specifier.getText()) === '') {
            const idx = specifier.end + offset - 1;
            source = source.slice(0, idx) + '.js' + source.slice(idx);
            offset += 3;
        }
    };
    process(program);
    fs_1.writeFileSync(file, source);
}
function processDir(dir) {
    const entries = fs_1.readdirSync(dir);
    for (const entry of entries) {
        const path = path_1.join(dir, entry);
        if (path.endsWith('.js')) {
            processFile(path);
        }
        else if (fs_1.statSync(path).isDirectory()) {
            processDir(path);
        }
    }
}
processDir(path_1.resolve(__dirname, '..', '..', 'esm'));
//# sourceMappingURL=add-js-extensions.js.map