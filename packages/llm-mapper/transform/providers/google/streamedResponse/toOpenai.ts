import {
  ChatCompletionChunk,
} from "../../../types/openai";
import {
  GoogleStreamEvent,
} from "../../../types/google";
import {
  mapGoogleFinishReason,
  mapGoogleUsage,
} from "../response/toOpenai";

export class GoogleToOpenAIStreamConverter {
  private messageId: string;
  private created: number;
  private model: string = "google/gemini";
  private sentInitial: boolean = false;
  private toolCallIndex: number = 0;

  constructor() {
    this.created = Math.floor(Date.now() / 1000);
    this.messageId = `chatcmpl-gemini-${this.created}`;
  }

  processLines(raw: string, onChunk: (chunk: ChatCompletionChunk) => void) {
    const lines = raw.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue;
      }

      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") {
        continue;
      }

      try {
        const event: GoogleStreamEvent = JSON.parse(jsonStr);
        const chunks = this.convert(event);
        for (const chunk of chunks) {
          onChunk(chunk);
        }
      } catch (error) {
        console.error("Failed to parse Gemini SSE data:", error);
      }
    }
  }

  convert(event: GoogleStreamEvent): ChatCompletionChunk[] {
    const chunks: ChatCompletionChunk[] = [];
    const candidate = event.candidates?.[0];
    if (!candidate) {
      return chunks;
    }

    if (event.modelVersion) {
      this.model = event.modelVersion;
    }

    if (!this.sentInitial) {
      this.sentInitial = true;
      chunks.push(
        this.createChunk({
          choices: [
            {
              index: candidate.index ?? 0,
              delta: { role: "assistant" },
              logprobs: null,
              finish_reason: null,
            },
          ],
        })
      );
    }

    const parts = Array.isArray(candidate.content)
      ? candidate.content
      : candidate.content
        ? [candidate.content]
        : [];

    for (const block of parts) {
      const blockParts = Array.isArray(block?.parts)
        ? block?.parts
        : block?.parts
          ? [block.parts]
          : [];

      for (const part of blockParts) {
        if (!part) {
          continue;
        }

        if (part.functionCall) {
          // Handle function calls (checked first since they may also have text)
          chunks.push(
            this.createChunk({
              choices: [
                {
                  index: candidate.index ?? 0,
                  delta: {
                    tool_calls: [
                      {
                        index: this.toolCallIndex,
                        id: `call_${this.toolCallIndex}`,
                        type: "function",
                        function: {
                          name: part.functionCall.name,
                          arguments: JSON.stringify(part.functionCall.args ?? {}),
                        },
                      },
                    ],
                  },
                  logprobs: null,
                  finish_reason: null,
                },
              ],
            })
          );

          this.toolCallIndex += 1;
        } else if (part.inlineData) {
          // Handle image output from Google's image generation models
          const mimeType = part.inlineData.mimeType || "image/png";
          const dataUri = `data:${mimeType};base64,${part.inlineData.data}`;
          chunks.push(
            this.createChunk({
              choices: [
                {
                  index: candidate.index ?? 0,
                  delta: {
                    images: [
                      {
                        type: "image_url",
                        image_url: {
                          url: dataUri,
                        },
                      },
                    ],
                  },
                  logprobs: null,
                  finish_reason: null,
                },
              ],
            })
          );
        } else if (part.text) {
          // Check if this is a thinking part (Google uses thought: true)
          if (part.thought === true) {
            // Emit thinking content as reasoning in the delta
            chunks.push(
              this.createChunk({
                choices: [
                  {
                    index: candidate.index ?? 0,
                    delta: { reasoning: part.text },
                    logprobs: null,
                    finish_reason: null,
                  },
                ],
              })
            );
          } else {
            // Regular content
            chunks.push(
              this.createChunk({
                choices: [
                  {
                    index: candidate.index ?? 0,
                    delta: { content: part.text },
                    logprobs: null,
                    finish_reason: null,
                  },
                ],
              })
            );
          }
        }
      }
    }

    if (candidate.finishReason) {
      chunks.push(
        this.createChunk({
          choices: [
            {
              index: candidate.index ?? 0,
              delta: {},
              logprobs: null,
              finish_reason: mapGoogleFinishReason(candidate.finishReason),
            },
          ],
          ...(event.usageMetadata
            ? { usage: mapGoogleUsage(event.usageMetadata) }
            : {}),
        })
      );
    }

    return chunks;
  }

  private createChunk(
    overrides: Partial<ChatCompletionChunk>
  ): ChatCompletionChunk {
    return {
      id: this.messageId,
      object: "chat.completion.chunk",
      created: this.created,
      model: this.model,
      system_fingerprint: this.model,
      choices: [],
      ...overrides,
    };
  }
}
