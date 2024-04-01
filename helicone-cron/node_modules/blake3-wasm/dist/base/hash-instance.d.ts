import { BaseHashInput, IBaseHashOptions } from './hash-fn';
import { IHashReader } from './hash-reader';
/**
 * A blake3 hash. Quite similar to Node's crypto hashing.
 *
 * Note that you must call {@link IHash#dispose} or {@link IHash#done} when
 * you're finished with it to free memory.
 */
export interface IHasher<T> {
    /**
     * Adds the given data to the hash.
     * @throws {Error} if {@link IHash#digest} has already been called.
     */
    update(data: BaseHashInput): this;
    /**
     * Returns a digest of the hash.
     *
     * If `dispose: false` is given in the options, the hash will not
     * automatically be disposed of, allowing you to continue updating
     * it after obtaining the current reader.
     */
    digest(options?: IBaseHashOptions & {
        dispose?: boolean;
    }): T;
    /**
     * Returns a {@link HashReader} for the current hash.
     *
     * If `dispose: false` is given in the options, the hash will not
     * automatically be disposed of, allowing you to continue updating
     * it after obtaining the current reader.
     */
    reader(options?: {
        dispose?: boolean;
    }): IHashReader<T>;
    /**
     * Frees data associated with the hash. This *must* be called if
     * {@link IHash#digest} is not called in order to free memory.
     */
    dispose(): void;
}
/**
 * @hidden
 */
export interface IInternalHash<Reader> {
    free(): void;
    reader(): Reader;
    update(bytes: Uint8Array): void;
    digest(into: Uint8Array): void;
}
export interface IHasherDigestOptions extends IBaseHashOptions {
    dispose?: boolean;
}
/**
 * Base implementation of hashing.
 */
export declare class BaseHash<Binary extends Uint8Array, InternalReader, Reader extends IHashReader<Binary>> implements IHasher<Binary> {
    private readonly alloc;
    private readonly getReader;
    private hash;
    constructor(implementation: IInternalHash<InternalReader>, alloc: (length: number) => Binary, getReader: (internal: InternalReader) => Reader);
    /**
     * @inheritdoc
     */
    update(data: BaseHashInput): this;
    /**
     * @inheritdoc
     */
    digest({ length, dispose }?: IHasherDigestOptions): Binary;
    /**
     * @inheritdoc
     */
    reader({ dispose }?: {
        dispose?: boolean;
    }): Reader;
    /**
     * @inheritdoc
     */
    dispose(): void;
}
