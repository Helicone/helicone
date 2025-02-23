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
    stream: {
      onChunk: async (chunk: string) => {
        if (options?.headers?.["x-cancel"] === "1") {
          abortController.abort();
          await writer.abort(new Error("Request cancelled"));
          return;
        }
        try {
          // For includeReasoning=false, chunk is already a string
          // For includeReasoning=true, chunk is a JSON string
          await writer.write(encoder.encode(chunk));
        } catch (error) {
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
          console.debug("Could not close stream:", error);
        }
      },
    },
  }).catch(async (error) => {
    console.error("Streaming error:", error);
    await writer.abort(error);
  });

  return stream.readable;
}
