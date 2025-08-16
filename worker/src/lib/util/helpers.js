export const once = (emitter, eventName) => new Promise((resolve) => {
    const listener = (value) => {
        emitter.removeListener(eventName, listener);
        resolve(value);
    };
    emitter.addListener(eventName, listener);
});
export async function withTimeout(promise, timeout) {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout));
    return (await Promise.race([promise, timeoutPromise]));
}
export function enumerate(arr) {
    return arr.map((item, index) => [index, item]);
}
export function deepCompare(a, b) {
    if (a === b)
        return true;
    if (typeof a === "object" && typeof b === "object") {
        if (Object.keys(a).length !== Object.keys(b).length)
            return false;
        for (const key in a) {
            if (!deepCompare(a[key], b[key]))
                return false;
        }
        return true;
    }
    return false;
}
export async function compress(str) {
    // Convert the string to a byte stream.
    const stream = new Blob([str]).stream();
    // Create a compressed stream.
    const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of compressedStream) {
        chunks.push(chunk);
    }
    return await concatUint8Arrays(chunks);
}
async function concatUint8Arrays(uint8arrays) {
    const blob = new Blob(uint8arrays);
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
}
export function getModelFromRequest(requestBody, path) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (requestBody && requestBody.model) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return requestBody.model;
    }
    const modelFromPath = getModelFromPath(path);
    if (modelFromPath) {
        return modelFromPath;
    }
    return null;
}
export function getModelFromPath(path) {
    const regex1 = /\/engines\/([^/]+)/;
    const regex2 = /models\/([^/:]+)/;
    let match = path.match(regex1);
    if (!match) {
        match = path.match(regex2);
    }
    if (match && match[1]) {
        return match[1];
    }
    else {
        return undefined;
    }
}
export function getModelFromResponse(responseBody) {
    try {
        if (typeof responseBody !== "object" || !responseBody) {
            return "unknown";
        }
        if (Array.isArray(responseBody)) {
            return "unknown";
        }
        return (responseBody["model"] || responseBody.body["model"] || "unknown");
    }
    catch (e) {
        return "unknown";
    }
}
