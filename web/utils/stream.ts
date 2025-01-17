export async function readStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const reader = stream.getReader();
  let fullResponse = "";
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      buffer += chunk;

      // Process complete SSE messages
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.slice(5).trim();
          if (content) {
            fullResponse += content;
            onChunk(content);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.startsWith("data: ")) {
      const content = buffer.slice(5).trim();
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    return fullResponse;
  } finally {
    reader.releaseLock();
  }
}
