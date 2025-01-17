"use server";
import { headers } from "next/headers";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export interface GenerationParameters {
  model: string;
  messages: OpenAI.ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  schema?: object extends object ? z.ZodType<object> : never;
  stream?: {
    onChunk: (chunk: string) => void;
    onCompletion: () => void;
  };
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1/",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generate<T extends object | undefined = undefined>(
  props: GenerationParameters
): Promise<T extends object ? T : string> {
  const headersList = await headers();
  const abortController = new AbortController();

  try {
    const response = await openai.chat.completions.create(
      {
        model: props.model,
        messages: props.messages,
        temperature: props.temperature,
        max_tokens: props.maxTokens,
        top_p: props.topP,
        frequency_penalty: props.frequencyPenalty,
        presence_penalty: props.presencePenalty,
        stop: props.stop,
        stream: !!props.stream,
        ...(props.schema && {
          response_format: zodResponseFormat(props.schema, "result"),
        }),
      },
      {
        signal: abortController.signal,
      }
    );

    if (props.stream) {
      let fullResponse = "";
      const stream =
        response as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      try {
        for await (const chunk of stream) {
          // Check if request was cancelled
          if (headersList.get("x-cancel") === "1") {
            abortController.abort();
            return fullResponse as T extends object ? T : string;
          }

          const content = chunk?.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            props.stream.onChunk(content);
          }
        }
        props.stream.onCompletion();
        return fullResponse as T extends object ? T : string;
      } catch (error) {
        // Handle stream interruption gracefully
        if (
          error instanceof Error &&
          (error.name === "ResponseAborted" || error.name === "AbortError")
        ) {
          return fullResponse as T extends object ? T : string;
        }
        throw error;
      }
    }

    const completionResponse =
      response as OpenAI.Chat.Completions.ChatCompletion;
    const content = completionResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Failed to generate response");
    }

    if (props.schema) {
      const parsed = props.schema.parse(JSON.parse(content));
      return parsed as T extends object ? T : string;
    }

    return content as T extends object ? T : string;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "ResponseAborted" || error.name === "AbortError")
    ) {
      return "" as T extends object ? T : string;
    }
    throw error;
  }
}
