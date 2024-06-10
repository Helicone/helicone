import { Body, Controller, Post, Route, Security, Tags, Request } from "tsoa";
import { Result, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { DataIsBeautifulManager } from "../../managers/DataIsBeautifulManager";

export type TimeSpan = "1m" | "3m" | "6m" | "all";
export type ModelElement = {
  model: string;
  provider: string;
  variations: string[];
};

export const modelNames: ModelElement[] = [
  {
    model: "gpt-3.5",
    provider: "OPENAI",
    variations: [
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-0301",
      "gpt-3.5-turbo-16k-0613",
    ],
  },
  {
    model: "gpt-4o",
    provider: "OPENAI",
    variations: ["gpt-4o", "gpt-4o-2024-05-13"],
  },
  {
    model: "gpt-4",
    provider: "OPENAI",
    variations: [
      "gpt-4",
      "gpt-4-0314",
      "gpt-4-0613",
      "gpt-4-32k",
      "gpt-4-32k-0314",
      "gpt-4-32k-0613",
    ],
  },
  {
    model: "gpt-4-turbo",
    provider: "OPENAI",
    variations: [
      "gpt-4-turbo",
      "gpt-4-turbo-preview",
      "gpt-4-turbo-0125-preview",
    ],
  },
  {
    model: "claude-3-opus-20240229",
    provider: "ANTHROPIC",
    variations: ["claude-3-opus-20240229"],
  },
  {
    model: "claude-3-sonnet-20240229",
    provider: "ANTHROPIC",
    variations: ["claude-3-sonnet-20240229"],
  },
  {
    model: "claude-3-haiku-20240307",
    provider: "ANTHROPIC",
    variations: ["claude-3-haiku-20240307"],
  },
  { model: "claude-2", provider: "ANTHROPIC", variations: ["claude-2"] },
  { model: "open-mixtral", provider: "MISTRAL", variations: ["open-mixtral"] },
  { model: "Llama", provider: "META", variations: ["Llama"] },
  { model: "dall-e", provider: "OPENAI", variations: ["dall-e"] },
  {
    model: "text-moderation",
    provider: "OPENAI",
    variations: ["text-moderation"],
  },
  {
    model: "text-embedding",
    provider: "OPENAI",
    variations: [
      "text-embedding",
      "text-embedding-ada",
      "text-embedding-ada-002",
    ],
  },
] as const;

export type ModelName = (typeof modelNames)[number]["model"];
export type ProviderName = (typeof modelNames)[number]["provider"];
export type DataIsBeautifulRequestBody = {
  timespan: TimeSpan;
  models?: ModelName[];
  provider?: ProviderName;
};

export type ModelBreakdown = {
  model: string;
  percent: number;
};

@Route("v1/public/dataisbeautiful")
@Tags("DataIsBeautiful")
@Security("api_key")
export class DataIsBeautifulRouter extends Controller {
  @Post("/")
  public async createNewExperiment(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ModelBreakdown[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await dataIsBeautifulManager.getModelBreakdown(requestBody);

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }
}
