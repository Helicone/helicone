"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isPromiseLike = (value) => typeof value === 'object' && !!value && 'then' in value;
/**
 * A helper function that calls `.dispose()` on the {@link IDisposable} when
 * the given function (or promise returned by the function) returns.
 */
exports.using = (disposable, fn) => {
    let ret;
    try {
        ret = fn(disposable);
    }
    catch (e) {
        disposable.dispose();
        throw e;
    }
    if (!isPromiseLike(ret)) {
        disposable.dispose();
        return ret;
    }
    return ret.then(value => {
        disposable.dispose();
        return value;
    }, err => {
        disposable.dispose();
        throw err;
    });
};
//# sourceMappingURL=disposable.js.map