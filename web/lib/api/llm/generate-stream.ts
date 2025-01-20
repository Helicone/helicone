import { generate, GenerateParams } from "./generate";

export async function generateStream(
  params: GenerateParams,
  options?: { headers?: { "x-cancel": string } }
): Promise<ReadableStream<Uint8Array>> {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  const abortController = new AbortController();

  let hasError = false;

  generate({
    ...params,
    signal: abortController.signal,
    stream: {
      onChunk: async (chunk: string) => {
        try {
          if (options?.headers?.["x-cancel"] === "1") {
            hasError = true;
            abortController.abort();
            await writer.abort(new Error("Request cancelled"));
            return;
          }
          if (!hasError) {
            await writer.write(encoder.encode(chunk));
          }
        } catch (error) {
          hasError = true;
          console.error("Error writing chunk:", error);
          await writer.abort(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      },
      onCompletion: async () => {
        try {
          if (!hasError && !writer.closed) {
            await writer.close();
          }
        } catch (error) {
          console.error("Error closing writer:", error);
        }
      },
    },
  }).catch(async error => {
    hasError = true;
    console.error("Streaming error:", error);
    try {
      await writer.abort(error);
    } catch (abortError) {
      console.error("Error aborting writer:", abortError);
    }
  });

  return stream.readable;
}
