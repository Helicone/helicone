/**
 * A type which requires manual disposal to free unmanaged resources. In the
 * context of this library, this usually means freeing memory from WebAssembly
 * code.
 */
export interface IDisposable {
    /**
     * Frees unmanaged resources of the object. This method is idempotent;
     * calling it multiple times will have no ill effects.
     */
    dispose(): void;
}
/**
 * A helper function that calls `.dispose()` on the {@link IDisposable} when
 * the given function (or promise returned by the function) returns.
 */
export declare const using: <T, D extends IDisposable>(disposable: D, fn: (d: D) => T) => T;
