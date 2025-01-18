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
        if (options?.headers?.["x-cancel"] === "1") {
          hasError = true;
          abortController.abort();
          await writer.abort(new Error("Request cancelled"));
          return;
        }
        if (!hasError) {
          await writer.write(encoder.encode(chunk));
        }
      },
      onCompletion: async () => {
        if (!hasError) {
          await writer.close();
        }
      },
    },
  }).catch(async error => {
    hasError = true;
    console.error("Streaming error:", error);
    await writer.abort(error);
  });

  return stream.readable;
}
