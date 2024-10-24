import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext, Log } from "./HandlerContext";
import { err, ok, PromiseGenericResult } from "../shared/result";
import OpenAI from "openai";

export class EmbeddingsHandler extends AbstractLogHandler {
  async handle(context: HandlerContext): PromiseGenericResult<string> {
    const request = context.message.log.request;
    // const response = context.message.log.response;
    const requestBody = context.processedLog.request.body;
    console.log("processed log", context.processedLog);

    const PROBABILITY_THRESHOLD = 0.8;

    if (Math.random() < PROBABILITY_THRESHOLD) {
      console.log(
        "Generating embedding for request probability",
        PROBABILITY_THRESHOLD
      );
      try {
        const embedding = await this.generateEmbedding(request, requestBody);
        context.message.log.request.embedding = embedding;
      } catch (error) {
        console.error("Error generating embedding", error);
      }
    } else {
      console.log(
        "Not generating embedding for request probability",
        PROBABILITY_THRESHOLD
      );
    }

    return await super.handle(context);
  }

  private async generateEmbedding(
    request: Log["request"],
    requestBody: any
  ): Promise<number[]> {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    try {
      const embedding = await openai.embeddings.create({
        input: JSON.stringify(request.properties), // TODO: is this the right thing to do?
        model: "text-embedding-3-small",
      });

      console.log("Generated embedding", embedding.data[0].embedding);

      return embedding.data[0].embedding;
    } catch (error) {
      throw error;
    }
  }
}
