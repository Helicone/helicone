import { z } from "zod";

export const functionCallOutput = z
  .object({
    name: z.string().default(""),
    arguments: z.string().default(""),
  })
  .optional();

export const toolCallsOutput = z.array(
  z.object({
    id: z.string(),
    function: z.object({
      name: z.string(),
      arguments: z.string(),
    }),
    type: z.literal("function"),
  })
);

const chatCompletionAssistantMessageParamSchema = z.object({
  role: z.literal("assistant"),
  content: z.union([z.string(), z.null()]).default(null),
  function_call: functionCallOutput.optional(),
  tool_calls: toolCallsOutput.optional(),
});

export const chatCompletionMessage = chatCompletionAssistantMessageParamSchema;
