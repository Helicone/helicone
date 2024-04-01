/**
 * Default hash length, in bytes, unless otherwise specified.
 */
export const defaultHashLength = 32;
/**
 * Converts the input to an Uint8Array.
 * @hidden
 */
export const inputToArray = (input) => input instanceof Uint8Array ? input : new Uint8Array(input);
//# sourceMappingURL=hash-fn.js.map