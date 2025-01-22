import { OpenAI } from "openai";
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
}
