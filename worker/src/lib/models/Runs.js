const VALID_STATUS = ["RUNNING", "SUCCESS", "FAILED", "CANCELLED"];
export function isValidStatus(status) {
    return VALID_STATUS.includes(status);
}
export function validateRun(run) {
    if (!run.name) {
        return { data: null, error: "Missing run.name" };
    }
    if (typeof run.name !== "string") {
        return { data: null, error: "run.name must be a string" };
    }
    if (run.description && typeof run.description !== "string") {
        return { data: null, error: "run.description must be a string" };
    }
    if (run.id && typeof run.id !== "string") {
        return { data: null, error: "run.id must be a string" };
    }
    if (run.timeoutSeconds && run.timeoutSeconds < 0) {
        return { data: null, error: "run.timeoutSeconds must be positive" };
    }
    if (run.customProperties && typeof run.customProperties !== "object") {
        return {
            data: null,
            error: "run.customProperties must be an object",
        };
    }
    return { data: true, error: null };
}
