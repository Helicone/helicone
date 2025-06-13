export async function readStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const reader = stream.getReader();
  let fullResponse = "";

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      fullResponse += chunk;
      onChunk(chunk);
    }
    return fullResponse;
  } finally {
    reader.releaseLock();
  }
}
