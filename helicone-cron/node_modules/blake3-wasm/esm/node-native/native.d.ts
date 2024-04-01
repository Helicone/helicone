/// <reference types="node" />
import { IInternalHash } from '../base/index';
export interface INativeReader {
    free?(): void;
    fill(target: Uint8Array): void;
    set_position(position: Buffer): void;
}
export interface INativeHash extends IInternalHash<INativeReader> {
    new (hashKey?: Buffer, context?: string): INativeHash;
}
export interface INativeModule {
    Hasher: INativeHash;
    hash(input: Buffer, length: number): Buffer;
}
declare const native: INativeModule;
export default native;
