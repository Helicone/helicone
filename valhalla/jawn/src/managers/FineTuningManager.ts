import {
  FineTuningJob,
  FineTuningJobEventsPage,
} from "openai/resources/fine-tuning/jobs";
import { OpenAIClient } from "../lib/clients/OpenAIClient";
import { HeliconeRequest } from "../lib/stores/request/request";
import { Result, err, ok } from "../lib/shared/result";
import crypto from "crypto";
import fs from "fs";
import { chatCompletionMessage } from "./types";
import { ChatCompletionMessageParam } from "openai/resources";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import OpenAI from "openai";

export class FineTuningManager {
  private openAIClient: OpenAIClient;
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openAIClient = new OpenAIClient(apiKey);
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async getFineTuneJob(id: string): Promise<
    Result<
      {
        job: FineTuningJob;
        events: FineTuningJobEventsPage;
      },
      string
    >
  > {
    try {
      let fineTune = await this.openai.fineTuning.jobs.retrieve(id);
      let events = await this.openai.fineTuning.jobs.listEvents(id, {
        limit: 10,
      });
      return ok({
        job: fineTune,
        events,
      });
    } catch (e) {
      console.error("Failed to get openai training", e);
      return err("Failed to get openai training" + e);
    }
  }

  async createFineTuneJob(
    requests: HeliconeRequest[],
    model: string,
    suffix: string
  ): Promise<Result<FineTuningJob, string>> {
    const formattedRows = requests
      .map((request) => {
        if (
          request.response_status !== 200 ||
          !request.request_body ||
          !request.request_body.messages ||
          request.request_body.messages.length === 0 ||
          !request.request_body.messages[0] ||
          !request.request_body.messages[0].content ||
          !request.response_body ||
          !request.response_body.choices ||
          request.response_body.choices.length === 0 ||
          !request.response_body.choices[0] ||
          !request.response_body.choices[0].message ||
          !request.response_body.choices[0].message.content
        ) {
          return;
        }
        const requestMessages = request.request_body.messages;
        const responseOutput = request.response_body.choices[0].message;
        const outputMessage = chatCompletionMessage.parse(responseOutput);
        const prunedInputMessages = this.pruneInputMessages(requestMessages);

        return {
          messages: [...prunedInputMessages, outputMessage].map(
            this.convertToolCallMessageToFunction
          ),
        };
      })
      .map((row) => Buffer.from(JSON.stringify(row) + "\n"));

    const fineTuneId = crypto.randomUUID();
    const fileId = `training_${new Date().toISOString()}`;
    const tempDirPath = `/tmp/${fineTuneId}`;
    const trainingFilePath = `${tempDirPath}/${fileId}.jsonl`;
    fs.mkdirSync(tempDirPath, { recursive: true });

    const writeStream = fs.createWriteStream(trainingFilePath);

    for await (const row of formattedRows) {
      if (!writeStream.write(row)) {
        // Wait for the stream to drain if it returns false
        await new Promise((resolve) => writeStream.once("drain", resolve));
      }
    }

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      writeStream.end();
    });

    try {
      const file = await this.openAIClient.uploadFineTuneFile(trainingFilePath);

      if (file.error || !file.data) {
        return err(file.error || "No data returned from OpenAI");
      }

      const fineTuneJob = await this.openAIClient.createFineTuneJob(
        file.data.id,
        "gpt-3.5-turbo-1106"
      );

      if (fineTuneJob.error || !fineTuneJob.data) {
        return err(fineTuneJob.error || "No data returned from OpenAI");
      }

      return ok(fineTuneJob.data);
    } catch (e) {
      console.error("Failed to start openai training", e);
      return err("Failed to start openai training" + e);
    } finally {
      fs.unlinkSync(trainingFilePath);
    }

    return err("Failed to start openai training");
  }

  convertToolCallMessagesToFunction(
    messages: ChatCompletionCreateParamsBase["messages"]
  ): ChatCompletionCreateParamsBase["messages"] {
    return messages.map(this.convertToolCallMessageToFunction);
  }

  convertToolCallMessageToFunction = (
    message: ChatCompletionCreateParamsBase["messages"][0]
  ) => {
    switch (message.role) {
      case "system":
      case "user":
      case "function":
        return message;
      case "assistant":
        return {
          ...message,
          function_call:
            message.function_call || message.tool_calls?.[0]?.function,
          tool_calls: undefined,
        };
      case "tool":
        return {
          role: "function" as const,
          content: message.content,
          name: message.tool_call_id,
        };
    }
  };

  pruneInputMessages = (messages: ChatCompletionMessageParam[]) => {
    messages = messages.filter(
      (message) =>
        message.content !== "" ||
        ("tool_calls" in message &&
          message.tool_calls &&
          message.tool_calls.length > 0)
    );
    return messages;
  };
}
