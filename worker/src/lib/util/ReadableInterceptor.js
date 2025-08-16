import { EventEmitter } from "events";
export class ReadableInterceptor {
    isStream;
    chunkEventName;
    chunkTimeoutMs;
    chunkEmitter = new EventEmitter();
    cachedChunk = null;
    responseBody = [];
    decoder = new TextDecoder("utf-8");
    firstChunkTimeUnix = null;
    stream;
    constructor(stream, isStream, chunkEventName = "done", chunkTimeoutMs = 30 * 60 * 1000 // Default to 30 minutes
    ) {
        this.isStream = isStream;
        this.chunkEventName = chunkEventName;
        this.chunkTimeoutMs = chunkTimeoutMs;
        this.stream = this.interceptStream(stream);
        this.setupChunkListener();
    }
    setupChunkListener() {
        this.once(this.chunkEventName).then((value) => {
            this.cachedChunk = value;
        });
    }
    interceptStream(stream) {
        const onDone = (reason) => {
            this.chunkEmitter.emit(this.chunkEventName, {
                body: this.responseBody,
                reason,
                endTimeUnix: new Date().getTime(),
                firstChunkTimeUnix: this.firstChunkTimeUnix,
            });
        };
        const onChunk = (chunk) => {
            if (this.isStream && this.firstChunkTimeUnix === null) {
                this.firstChunkTimeUnix = Date.now();
            }
            this.responseBody.push(this.decoder.decode(chunk, { stream: true }));
        };
        const reader = stream.getReader();
        const readable = new ReadableStream({
            async pull(controller) {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        controller.close();
                        onDone("done");
                        return;
                    }
                    if (value) {
                        controller.enqueue(value);
                        onChunk(value);
                    }
                }
                catch (error) {
                    console.error("An error occurred while reading the stream:", error);
                    controller.error(error);
                }
            },
            cancel(reason) {
                console.error("Stream was canceled:", reason);
                stream.cancel(reason);
                onDone("cancel");
            },
        });
        return readable;
    }
    async waitForStream() {
        const startTime = Date.now();
        while (!this.cachedChunk) {
            // Check if the waiting duration has exceeded streamTimeoutMs
            if (Date.now() - startTime >= this.chunkTimeoutMs) {
                throw new Error("Waiting for chunk timed out");
            }
            // Wait for 1s before rechecking
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return this.cachedChunk;
    }
    once(eventName) {
        return new Promise((resolve, _reject) => {
            const listener = (value) => {
                clearTimeout(timeoutId);
                this.chunkEmitter.removeListener(eventName, listener);
                resolve(value);
            };
            const timeoutId = setTimeout(() => {
                this.chunkEmitter.removeListener(eventName, listener);
                resolve({
                    body: this.responseBody,
                    reason: "timeout",
                    endTimeUnix: new Date().getTime(),
                    firstChunkTimeUnix: this.firstChunkTimeUnix,
                });
            }, this.chunkTimeoutMs);
            this.chunkEmitter.addListener(eventName, listener);
        });
    }
}
