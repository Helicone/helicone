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
} from "../../../types/responses";

export class ChatToResponsesStreamConverter {
  private responseId: string = "";
  private model: string = "";
  private created: number = 0;
  private started: boolean = false;
  private textBuffer: string = "";
  private toolCalls: Map<number, { id: string; name: string; arguments: string; item_id: string }>; // by index
  private itemAdded: boolean = false;
  private partAdded: boolean = false;
  private emittedFunctionItems: Set<string> = new Set();
  private completedEmitted: boolean = false;

  // Reasoning state
  private reasoningBuffer: string = "";
  private reasoningItemId: string = "";
  private reasoningItemAdded: boolean = false;
  private reasoningSummaryPartAdded: boolean = false;
  private reasoningDone: boolean = false;

  constructor() {
    this.toolCalls = new Map();
  }

  // Get the output_index for message/function items (1 if reasoning present, 0 otherwise)
  private getMessageOutputIndex(): number {
    return this.reasoningItemAdded ? 1 : 0;
  }

  // Finalize reasoning if it was started but not finished
  private finalizeReasoning(events: ResponsesStreamEvent[]): void {
    if (this.reasoningItemAdded && !this.reasoningDone) {
      // Emit reasoning_summary_text.done
      const textDone: ResponseReasoningSummaryTextDoneEvent = {
        type: "response.reasoning_summary_text.done",
        item_id: this.reasoningItemId,
        output_index: 0,
        summary_index: 0,
        text: this.reasoningBuffer,
      };
      events.push(textDone);

      // Emit reasoning_summary_part.done
      const partDone: ResponseReasoningSummaryPartDoneEvent = {
        type: "response.reasoning_summary_part.done",
        item_id: this.reasoningItemId,
        output_index: 0,
        summary_index: 0,
        part: { type: "summary_text", text: this.reasoningBuffer },
      };
      events.push(partDone);

      // Emit output_item.done for reasoning
      events.push({
        type: "response.output_item.done",
        output_index: 0,
        item: {
          id: this.reasoningItemId,
          type: "reasoning",
          summary: [{ type: "summary_text", text: this.reasoningBuffer }],
        },
      } as any);

      this.reasoningDone = true;
    }
  }

  convert(chunk: OpenAIStreamEvent): ResponsesStreamEvent[] {
    const events: ResponsesStreamEvent[] = [];

    const c = chunk as ChatCompletionChunk;

    if (!this.started) {
      this.responseId = c.id;
      this.model = c.model;
      this.created = c.created;
      this.started = true;
      this.reasoningItemId = `rs_${this.responseId}`;

      const createdEvt: ResponseCreatedEvent = {
        type: "response.created",
        response: {
          id: this.responseId,
          object: "response",
          created_at: this.created as any,
          status: "in_progress" as any,
          output: [],
          model: this.model,
        },
      };
      events.push(createdEvt);

      // emit in_progress to align with clients that expect this after created
      events.push({ type: "response.in_progress", response: { id: this.responseId } } as any);
    }

    // aggregate content and emit text deltas
    for (const choice of c.choices ?? []) {
      // Handle reasoning deltas (comes before content)
      if (choice?.delta?.reasoning) {
        const delta = choice.delta.reasoning;
        if (delta.length > 0) {
          this.reasoningBuffer += delta;

          // Before first reasoning delta, add reasoning item and summary_part
          if (!this.reasoningItemAdded) {
            events.push({
              type: "response.output_item.added",
              output_index: 0,
              item: {
                id: this.reasoningItemId,
                type: "reasoning",
                summary: [],
              },
            } as any);
            this.reasoningItemAdded = true;
          }

          if (!this.reasoningSummaryPartAdded) {
            const partAdded: ResponseReasoningSummaryPartAddedEvent = {
              type: "response.reasoning_summary_part.added",
              item_id: this.reasoningItemId,
              output_index: 0,
              summary_index: 0,
              part: { type: "summary_text", text: "" },
            };
            events.push(partAdded);
            this.reasoningSummaryPartAdded = true;
          }

          // Emit reasoning_summary_text.delta
          const deltaEvt: ResponseReasoningSummaryTextDeltaEvent = {
            type: "response.reasoning_summary_text.delta",
            item_id: this.reasoningItemId,
            output_index: 0,
            summary_index: 0,
            delta,
          };
          events.push(deltaEvt);
        }
      }

      if (choice?.delta?.content) {
        const delta = choice.delta.content;
        if (delta.length > 0) {
          // If we have reasoning and haven't finished it, finish it now
          if (this.reasoningItemAdded && !this.reasoningDone) {
            this.finalizeReasoning(events);
          }

          this.textBuffer += delta;
          const msgOutputIndex = this.getMessageOutputIndex();

          // before first text delta, add item and content_part events
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
            } as any);
            this.itemAdded = true;
          }
          if (!this.partAdded) {
            events.push({
              type: "response.content_part.added",
              item_id: `msg_${this.responseId}`,
              output_index: msgOutputIndex,
              content_index: 0,
              part: { type: "output_text", text: "", annotations: [] },
            } as any);
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

      // streamed tool calls
      if (choice?.delta?.tool_calls && Array.isArray(choice.delta.tool_calls)) {
        // If we have reasoning and haven't finished it, finish it now
        if (this.reasoningItemAdded && !this.reasoningDone) {
          this.finalizeReasoning(events);
        }

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

          // if its tha first time we see this tool call index, emit output_item.added for function_call
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
            } as any);
            this.emittedFunctionItems.add(existing.item_id);
          }

          if (tc.function?.arguments) {
            events.push({
              type: "response.function_call_arguments.delta",
              item_id: existing.item_id,
              output_index: msgOutputIndex,
              delta: tc.function.arguments,
            } as any);
          }
        }
      }

      // if finish reason was sent for this choice, emit done + completed
      if (choice?.finish_reason) {
        // Finalize reasoning if present
        if (this.reasoningItemAdded && !this.reasoningDone) {
          this.finalizeReasoning(events);
        }

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
            } as any);
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
          } as any);
        }

        // Finalize any function calls
        this.toolCalls.forEach((tc) => {
          events.push({
            type: "response.function_call_arguments.done",
            item_id: tc.item_id,
            output_index: msgOutputIndex,
            arguments: tc.arguments || "{}",
          } as any);
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
          } as any);
        });

        // Don't emit completed here - wait for usage chunk to arrive
        // The completed event will be emitted when usage arrives
      }
    }

    // usage arrives in the final chunk with empty choices
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
      };

      // Build output array: reasoning (if present), then message, then function calls
      const output: any[] = [];

      if (this.reasoningItemAdded) {
        output.push({
          id: this.reasoningItemId,
          type: "reasoning" as const,
          summary: [{ type: "summary_text", text: this.reasoningBuffer }],
        });
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
          created_at: this.created as any,
          status: "completed" as any,
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
