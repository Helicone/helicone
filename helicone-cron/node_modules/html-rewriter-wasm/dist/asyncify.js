const assert = require("assert");

/**
 * @typedef {object} WasmExports
 * @property {WebAssembly.Memory} memory
 * @property {function} asyncify_get_state
 * @property {function} asyncify_start_unwind
 * @property {function} asyncify_stop_unwind
 * @property {function} asyncify_start_rewind
 * @property {function} asyncify_stop_rewind
 */

/**
 * @type {WasmExports}
 */
let wasm;

/**
 * @param {WasmExports} wasmExports
 */
function setWasmExports(wasmExports) {
  wasm = wasmExports;
}

/**
 * @type {Int32Array}
 */
let cachedInt32Memory = null;

/**
 * @returns {Int32Array}
 */
function getInt32Memory() {
  if (
    cachedInt32Memory === null ||
    cachedInt32Memory.buffer !== wasm.memory.buffer
  ) {
    cachedInt32Memory = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory;
}

// https://github.com/WebAssembly/binaryen/blob/fb9de9d391a7272548dcc41cd8229076189d7398/src/passes/Asyncify.cpp#L99
const State = {
  NONE: 0,
  UNWINDING: 1,
  REWINDING: 2,
};

function assertNoneState() {
  assert.strictEqual(wasm.asyncify_get_state(), State.NONE);
}

/**
 * Maps `HTMLRewriter`s (their `asyncifyStackPtr`s) to `Promise`s.
 * `asyncifyStackPtr` acts as unique reference to `HTMLRewriter`.
 * Each rewriter MUST have AT MOST ONE pending promise at any time.
 * @type {Map<number, Promise>}
 */
const promises = new Map();

/**
 * @param {number} stackPtr
 * @param {Promise} promise
 */
function awaitPromise(stackPtr, promise) {
  if (wasm.asyncify_get_state() === State.REWINDING) {
    wasm.asyncify_stop_rewind();
    return;
  }

  assertNoneState();

  // https://github.com/WebAssembly/binaryen/blob/fb9de9d391a7272548dcc41cd8229076189d7398/src/passes/Asyncify.cpp#L106
  assert.strictEqual(stackPtr % 4, 0);
  getInt32Memory().set([stackPtr + 8, stackPtr + 1024], stackPtr / 4);

  wasm.asyncify_start_unwind(stackPtr);

  assert(!promises.has(stackPtr));
  promises.set(stackPtr, promise);
}

/**
 * @param {HTMLRewriter} rewriter
 * @param {Function} fn
 * @param args
 */
async function wrap(rewriter, fn, ...args) {
  const stackPtr = rewriter.asyncifyStackPtr;

  assertNoneState();
  let result = fn(...args);

  while (wasm.asyncify_get_state() === State.UNWINDING) {
    wasm.asyncify_stop_unwind();

    assertNoneState();
    assert(promises.has(stackPtr));
    await promises.get(stackPtr);
    promises.delete(stackPtr);

    assertNoneState();
    wasm.asyncify_start_rewind(stackPtr);
    result = fn();
  }

  assertNoneState();
  return result;
}

module.exports = { awaitPromise, setWasmExports, wrap };
