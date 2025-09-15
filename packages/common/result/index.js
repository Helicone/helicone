"use strict";
/**
 * Common Result type for safe operations across the codebase
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultsAll = exports.promiseResultMap = exports.map = exports.resultMap = exports.err = exports.ok = exports.unwrapList = exports.unwrapAsync = exports.unwrap = exports.isSuccess = exports.isError = void 0;
function isError(result) {
    return result.error !== null;
}
exports.isError = isError;
function isSuccess(result) {
    return result.error === null;
}
exports.isSuccess = isSuccess;
function unwrap(result) {
    if (isError(result)) {
        throw new Error(JSON.stringify(result.error));
    }
    return result.data;
}
exports.unwrap = unwrap;
async function unwrapAsync(result) {
    return unwrap(await result);
}
exports.unwrapAsync = unwrapAsync;
function unwrapList(results) {
    return results.map((result) => unwrap(result));
}
exports.unwrapList = unwrapList;
function ok(data) {
    return { data, error: null };
}
exports.ok = ok;
function err(error) {
    return { data: null, error };
}
exports.err = err;
function resultMap(result, f) {
    if (isError(result)) {
        return result;
    }
    return { data: f(result.data), error: null };
}
exports.resultMap = resultMap;
function map(result, mapFn) {
    if (result.error === null) {
        return ok(mapFn(result.data));
    }
    return err(result.error);
}
exports.map = map;
function promiseResultMap(result, f) {
    if (isError(result)) {
        return Promise.resolve(result);
    }
    return f(result.data).then((data) => ok(data));
}
exports.promiseResultMap = promiseResultMap;
function resultsAll(results) {
    const data = [];
    for (const r of results) {
        if (r.error !== null) {
            return err(r.error);
        }
        data.push(r.data);
    }
    return ok(data);
}
exports.resultsAll = resultsAll;
