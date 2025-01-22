import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { GenerateParams } from "@/lib/api/llm/generate";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1/",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const params = req.body as GenerateParams;
    const abortController = new AbortController();

    const response = await openai.chat.completions.create(
      {
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stop: params.stop,
        stream: params.stream !== undefined,
        ...(params.schema && {
          response_format: zodResponseFormat(params.schema, "result"),
        }),
      },
      {
        signal: abortController.signal,
      }
    );

    if (params.stream) {
      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      const stream =
        response as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      try {
        for await (const chunk of stream) {
          // Check if request was cancelled
          if (req.headers["x-cancel"] === "1") {
            abortController.abort();
            res.end();
            return;
          }

          const content = chunk?.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            res.write(content);
            // @ts-ignore - flush exists on NodeJS.ServerResponse
            res.flush?.();
          }
        }
        res.end();
        return;
      } catch (error) {
        // Handle stream interruption gracefully
        if (
          error instanceof Error &&
          (error.name === "ResponseAborted" || error.name === "AbortError")
        ) {
          res.end();
          return;
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

    if (params.schema) {
      const parsed = params.schema.parse(JSON.parse(content));
      return res.json(parsed);
    }

    return res.json({ content });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "ResponseAborted" || error.name === "AbortError")
    ) {
      return res.json({ content: "" });
    }
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}
