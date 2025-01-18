import { generate, GenerateParams } from "./generate";

export async function generateStream(
  params: GenerateParams,
  options?: { headers?: { "x-cancel": string } }
): Promise<ReadableStream<Uint8Array>> {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  generate({
    ...params,
    stream: {
      onChunk: async (chunk: string) => {
        if (options?.headers?.["x-cancel"] === "1") {
          await writer.close();
          return;
        }
        await writer.write(encoder.encode(chunk));
      },
      onCompletion: async () => {
        await writer.close();
      },
    },
  }).catch(async error => {
    console.error("Streaming error:", error);
    await writer.abort(error);
  });

  return stream.readable;
}
