import { ChatCompletionChunk, OpenAIStreamEvent } from "../../../types/openai";
import {
  ResponsesStreamEvent,
  ResponseCreatedEvent,
  ResponseOutputTextDeltaEvent,
  ResponseOutputTextDoneEvent,
  ResponseCompletedEvent,
  ResponsesUsage,
  ResponseReasoningSummaryPartAddedEvent,
  ResponseReasoningSummaryTextDeltaEvent,
  ResponseReasoningSummaryTextDoneEvent,
  ResponseReasoningSummaryPartDoneEvent,
  ResponsesResponseBody,
} from "../../../types/responses";

interface ReasoningState {
  id: string;
  buffer: string;
  signature: string | null;
  itemAdded: boolean;
  summaryPartAdded: boolean;
  done: boolean;
}

export class ChatToResponsesStreamConverter {
  private responseId: string = "";
  private model: string = "";
  private created: number = 0;
  private started: boolean = false;
  private textBuffer: string = "";
  private toolCalls: Map<number, { id: string; name: string; arguments: string; item_id: string }>;
  private itemAdded: boolean = false;
  private partAdded: boolean = false;
  private emittedFunctionItems: Set<string> = new Set();
  private completedEmitted: boolean = false;

  private reasoningStates: ReasoningState[] = [];
  private currentReasoningIndex: number = -1;

  constructor() {
    this.toolCalls = new Map();
  }

  private getOrCreateReasoningState(index: number): ReasoningState {
    while (this.reasoningStates.length <= index) {
      this.reasoningStates.push({
        id: `rs_${this.responseId}_${this.reasoningStates.length}`,
        buffer: "",
        signature: null,
        itemAdded: false,
        summaryPartAdded: false,
        done: false,
      });
    }
    return this.reasoningStates[index];
  }

  private getMessageOutputIndex(): number {
    return this.reasoningStates.filter(s => s.itemAdded).length;
  }

  private finalizeReasoningState(events: ResponsesStreamEvent[], state: ReasoningState, outputIndex: number): void {
    if (state.itemAdded && !state.done) {
      const textDone: ResponseReasoningSummaryTextDoneEvent = {
        type: "response.reasoning_summary_text.done",
        item_id: state.id,
        output_index: outputIndex,
        summary_index: 0,
        text: state.buffer,
      };
      events.push(textDone);

      const partDone: ResponseReasoningSummaryPartDoneEvent = {
        type: "response.reasoning_summary_part.done",
        item_id: state.id,
        output_index: outputIndex,
        summary_index: 0,
        part: { type: "summary_text", text: state.buffer },
      };
      events.push(partDone);

      events.push({
        type: "response.output_item.done",
        output_index: outputIndex,
        item: {
          id: state.id,
          type: "reasoning",
          summary: [{ type: "summary_text", text: state.buffer }],
          encrypted_content: state.signature,
        },
      });

      state.done = true;
    }
  }

  private finalizeAllReasoning(events: ResponsesStreamEvent[]): void {
    this.reasoningStates.forEach((state, index) => {
      this.finalizeReasoningState(events, state, index);
    });
  }

  convert(chunk: OpenAIStreamEvent): ResponsesStreamEvent[] {
    const events: ResponsesStreamEvent[] = [];

    const c = chunk as ChatCompletionChunk;

    if (!this.started) {
      this.responseId = c.id;
      this.model = c.model;
      this.created = c.created;
      this.started = true;

      const createdEvt: ResponseCreatedEvent = {
        type: "response.created",
        response: {
          id: this.responseId,
          object: "response",
          created_at: this.created,
          status: "in_progress",
          output: [],
          model: this.model,
        },
      };
      events.push(createdEvt);

      events.push({ type: "response.in_progress", response: { id: this.responseId, object: "response", model: this.model, output: [] } });
    }

    for (const choice of c.choices ?? []) {
      // Handle reasoning_details (multiple blocks with signatures)
      if (choice?.delta?.reasoning_details && choice.delta.reasoning_details.length > 0) {
        for (let i = 0; i < choice.delta.reasoning_details.length; i++) {
          const detail = choice.delta.reasoning_details[i];
          const blockIndex = this.currentReasoningIndex >= 0 ? this.currentReasoningIndex : 0;
          const state = this.getOrCreateReasoningState(blockIndex);

          if (detail.signature && !state.signature) {
            state.signature = detail.signature;
            this.finalizeReasoningState(events, state, blockIndex);
            this.currentReasoningIndex = blockIndex + 1;
          }

          if (detail.thinking) {
            state.buffer += detail.thinking;
          }
        }
      }

      // Handle reasoning deltas (simple reasoning string)
      if (choice?.delta?.reasoning) {
        const delta = choice.delta.reasoning;
        if (delta.length > 0) {
          if (this.currentReasoningIndex < 0) {
            this.currentReasoningIndex = 0;
          }
          const state = this.getOrCreateReasoningState(this.currentReasoningIndex);
          state.buffer += delta;

          if (!state.itemAdded) {
            events.push({
              type: "response.output_item.added",
              output_index: this.currentReasoningIndex,
              item: {
                id: state.id,
                type: "reasoning",
                summary: [],
              },
            });
            state.itemAdded = true;
          }

          if (!state.summaryPartAdded) {
            const partAdded: ResponseReasoningSummaryPartAddedEvent = {
              type: "response.reasoning_summary_part.added",
              item_id: state.id,
              output_index: this.currentReasoningIndex,
              summary_index: 0,
              part: { type: "summary_text", text: "" },
            };
            events.push(partAdded);
            state.summaryPartAdded = true;
          }

          const deltaEvt: ResponseReasoningSummaryTextDeltaEvent = {
            type: "response.reasoning_summary_text.delta",
            item_id: state.id,
            output_index: this.currentReasoningIndex,
            summary_index: 0,
            delta,
          };
          events.push(deltaEvt);
        }
      }

      if (choice?.delta?.content) {
        const delta = choice.delta.content;
        if (delta.length > 0) {
          this.finalizeAllReasoning(events);

          this.textBuffer += delta;
          const msgOutputIndex = this.getMessageOutputIndex();

          if (!this.itemAdded) {
            events.push({
              type: "response.output_item.added",
              output_index: msgOutputIndex,
              item: {
                id: `msg_${this.responseId}`,
                type: "message",
                status: "in_progress",
                role: "assistant",
                content: [],
              },
            });
            this.itemAdded = true;
          }
          if (!this.partAdded) {
            events.push({
              type: "response.content_part.added",
              item_id: `msg_${this.responseId}`,
              output_index: msgOutputIndex,
              content_index: 0,
              part: { type: "output_text", text: "", annotations: [] },
            });
            this.partAdded = true;
          }
          const deltaEvt: ResponseOutputTextDeltaEvent = {
            type: "response.output_text.delta",
            item_id: `msg_${this.responseId}`,
            output_index: msgOutputIndex,
            content_index: 0,
            delta,
          };
          events.push(deltaEvt);
        }
      }

      if (choice?.delta?.tool_calls && Array.isArray(choice.delta.tool_calls)) {
        this.finalizeAllReasoning(events);

        const msgOutputIndex = this.getMessageOutputIndex();

        for (const tc of choice.delta.tool_calls) {
          const idx = tc.index ?? 0;
          const existing = this.toolCalls.get(idx) || {
            id: tc.id || `call_${idx}`,
            name: tc.function?.name || "",
            arguments: "",
            item_id: `fn_${this.responseId}_${idx}`,
          };
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          this.toolCalls.set(idx, existing);

          if (!this.emittedFunctionItems.has(existing.item_id)) {
            events.push({
              type: "response.output_item.added",
              output_index: msgOutputIndex,
              item: {
                id: existing.item_id,
                type: "function_call",
                status: "in_progress",
                name: existing.name || "",
                call_id: existing.id,
                arguments: "",
                parsed_arguments: null,
              },
            });
            this.emittedFunctionItems.add(existing.item_id);
          }

          if (tc.function?.arguments) {
            events.push({
              type: "response.function_call_arguments.delta",
              item_id: existing.item_id,
              output_index: msgOutputIndex,
              delta: tc.function.arguments,
            });
          }
        }
      }

      if (choice?.finish_reason) {
        this.finalizeAllReasoning(events);

        const msgOutputIndex = this.getMessageOutputIndex();

        if (this.itemAdded) {
          const doneEvt: ResponseOutputTextDoneEvent = {
            type: "response.output_text.done",
            item_id: `msg_${this.responseId}`,
            output_index: msgOutputIndex,
            content_index: 0,
            text: this.textBuffer,
          };
          events.push(doneEvt);

          if (this.partAdded) {
            events.push({
              type: "response.content_part.done",
              item_id: `msg_${this.responseId}`,
              output_index: msgOutputIndex,
              content_index: 0,
              part: { type: "output_text", text: this.textBuffer, annotations: [] },
            });
          }
          events.push({
            type: "response.output_item.done",
            output_index: msgOutputIndex,
            item: {
              id: `msg_${this.responseId}`,
              type: "message",
              status: "completed",
              role: "assistant",
              content: [
                { type: "output_text", text: this.textBuffer, annotations: [] },
              ],
            },
          });
        }

        this.toolCalls.forEach((tc) => {
          events.push({
            type: "response.function_call_arguments.done",
            item_id: tc.item_id,
            output_index: msgOutputIndex,
            arguments: tc.arguments || "{}",
          });
          events.push({
            type: "response.output_item.done",
            output_index: msgOutputIndex,
            item: {
              id: tc.item_id,
              type: "function_call",
              status: "completed",
              name: tc.name || "",
              call_id: tc.id,
              arguments: tc.arguments || "{}",
              parsed_arguments: null,
            },
          });
        });
      }
    }

    if (c.usage && !this.completedEmitted) {
      const usage: ResponsesUsage = {
        input_tokens: c.usage.prompt_tokens,
        output_tokens: c.usage.completion_tokens,
        total_tokens: c.usage.total_tokens,
        input_tokens_details: c.usage.prompt_tokens_details?.cached_tokens
          ? { cached_tokens: c.usage.prompt_tokens_details.cached_tokens }
          : undefined,
        output_tokens_details: c.usage.completion_tokens_details?.reasoning_tokens
          ? {
              reasoning_tokens: c.usage.completion_tokens_details.reasoning_tokens,
            }
          : undefined,
        modality_tokens: c.usage.modality_tokens,
      };

      const output: ResponsesResponseBody["output"] = [];

      for (const state of this.reasoningStates) {
        if (state.itemAdded) {
          output.push({
            id: state.id,
            type: "reasoning" as const,
            summary: [{ type: "summary_text", text: state.buffer }],
            encrypted_content: state.signature,
          });
        }
      }

      if (this.textBuffer.length > 0) {
        output.push({
          id: `msg_${this.responseId}`,
          type: "message" as const,
          status: "completed" as const,
          role: "assistant" as const,
          content: [{ type: "output_text" as const, text: this.textBuffer, annotations: [] }],
        });
      }

      output.push(
        ...Array.from(this.toolCalls.values()).map((tc) => ({
          id: tc.id,
          type: "function_call" as const,
          status: "completed" as const,
          name: tc.name || "",
          call_id: tc.id,
          arguments: tc.arguments || "{}",
          parsed_arguments: null,
        }))
      );

      const completed: ResponseCompletedEvent = {
        type: "response.completed",
        response: {
          id: this.responseId,
          object: "response",
          created: this.created,
          created_at: this.created,
          status: "completed",
          model: this.model,
          output,
          usage,
        },
      };
      events.push(completed);
      this.completedEmitted = true;
    }

    return events;
  }
}
