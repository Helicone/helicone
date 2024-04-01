import { provideWasm } from './esm/browser/wasm';
import * as wasm from './dist/wasm/browser';

provideWasm(wasm);

export * from './esm/browser';
