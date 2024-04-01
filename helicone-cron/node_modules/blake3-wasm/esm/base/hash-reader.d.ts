import { IDisposable } from './disposable';
/**
 * The maximum number of bytes that can be read from the hash.
 *
 * Calculated out 2^64-1, since `Xn` syntax (for `Xn ** Yn`) requires TS
 * targeting esnext/es2020 which includes features that Node 10 doesn't
 * yet supported.
 */
export declare const maxHashBytes: bigint;
/**
 * The HashReader is a type returned from any of the hash functions. It can
 */
export interface IHashReader<T> extends IDisposable {
    /**
     * Returns the position of the reader in the hash. Can be written to to seek.
     */
    position: bigint;
    /**
     * Reads data from the hash into the target array. The target will always
     * be completely filled with data.
     */
    readInto(target: Uint8Array): void;
    /**
     * Reads and returns the given number of bytes from the hash, advancing
     * the position of the reader.
     */
    read(bytes: number): T;
}
/**
 * Underlying native or wasm module code backing the reader.
 * @hidden
 */
export interface IInternalReader {
    free?(): void;
    fill(target: Uint8Array): void;
    set_position(position: bigint): void;
}
/**
 * Base hash reader implementation.
 */
export declare abstract class BaseHashReader<T extends Uint8Array> implements IHashReader<T> {
    private reader;
    private pos;
    get position(): bigint;
    set position(value: bigint);
    constructor(reader: IInternalReader);
    /**
     * @inheritdoc
     */
    readInto(target: Uint8Array): void;
    /**
     * @inheritdoc
     */
    read(bytes: number): T;
    /**
     * @inheritdoc
     */
    dispose(): void;
    protected abstract alloc(bytes: number): T;
    private boundsCheck;
}
