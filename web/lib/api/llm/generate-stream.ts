import { generate, GenerateParams } from "./generate";

export async function generateStream(
  params: GenerateParams,
  options?: { headers?: { "x-cancel": string } }
): Promise<ReadableStream<Uint8Array>> {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  const abortController = new AbortController();

  generate({
    ...params,
    signal: abortController.signal,
    // @ts-ignore
    stream: {
      onChunk: async (chunk: string) => {
        if (options?.headers?.["x-cancel"] === "1") {
          abortController.abort();
          await writer.abort(new Error("Request cancelled"));
          return;
        }
        try {
          // Pass through the raw chunk exactly as received
          await writer.write(encoder.encode(chunk));
        } catch (error) {
          console.error("[generateStream] Error writing chunk:", error);
          await writer.abort(error);
          throw error;
        }
      },
      onCompletion: async () => {
        try {
          await writer.ready;
          await writer.close();
        } catch (error) {
          // If we can't close, the stream is probably already closed or errored
          console.debug("[generateStream] Could not close stream:", error);
        }
      },
    },
  }).catch(async (error) => {
    console.error("[generateStream] Streaming error:", error);
    await writer.abort(error);
  });

  return stream.readable;
}
