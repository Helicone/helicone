export declare type BrowserEncoding = 'hex' | 'base64' | 'utf8';
/**
 * @hidden
 */
export declare const mustGetEncoder: (encoding: BrowserEncoding) => (data: Uint8Array) => string;
