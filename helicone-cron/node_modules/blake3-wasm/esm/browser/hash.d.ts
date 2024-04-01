import { BrowserEncoding } from './encoding';
/**
 * Hash returned from functions in the browser.
 */
export declare class Hash extends Uint8Array {
    /**
     * A constant-time comparison against the other hash/array.
     */
    equals(other: unknown): boolean;
    toString(encoding?: BrowserEncoding): string;
}
