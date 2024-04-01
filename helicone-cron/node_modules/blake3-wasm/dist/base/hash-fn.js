"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Default hash length, in bytes, unless otherwise specified.
 */
exports.defaultHashLength = 32;
/**
 * Converts the input to an Uint8Array.
 * @hidden
 */
exports.inputToArray = (input) => input instanceof Uint8Array ? input : new Uint8Array(input);
//# sourceMappingURL=hash-fn.js.map