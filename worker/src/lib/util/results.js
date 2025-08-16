export function mapPostgrestErr(result) {
    if (result.error === null) {
        return { data: result.data, error: null };
    }
    return { data: null, error: result.error.message };
}
export function errMap(result, map) {
    if (result.error === null) {
        return ok(result.data);
    }
    return err(map(result.error));
}
export function map(result, map) {
    if (result.error === null) {
        return ok(map(result.data));
    }
    return err(result.error);
}
export function isErr(result) {
    return result.error !== null;
}
export function ok(data) {
    return { data: data, error: null };
}
export function err(error) {
    return { data: null, error: error };
}
