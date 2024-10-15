import {
  Body,
  Controller,
  Post,
  Route,
  Security,
  Tags,
  Request,
  Get,
} from "tsoa";
import { Result, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { DataIsBeautifulManager } from "../../managers/DataIsBeautifulManager";
import { cacheResult } from "../../utils/cacheResult";

/***
 * FUTURE HELICONE DEVS ALL THE ROUTES HERE ARE CACHE UNAUTHENTICATED!! PLEASE DO NOT USE THE AUTH PARAM
 *
 *
 */

export type TimeSpan = "7d" | "1m" | "3m";

export const allProviders = [
  "OPENAI",
  "ANTHROPIC",
  "AZURE",
  "GOOGLE",
  "OPENROUTER",
  "TOGETHER",
  "CLOUDFLARE",
  "CUSTOM",
  "DEEPINFRA",
  "FIREWORKS",
  "GROQ",
  "META",
  "MISTRAL",
  "OTHER",
] as const;

export const modelNames = [
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
    model: "gpt-4o-mini",
    provider: "OPENAI",
    variations: ["gpt-4o-mini", "gpt-4o-mini-2024-07-18"],
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
    model: "claude-3-opus",
    provider: "ANTHROPIC",
    variations: ["claude-3-opus-20240229"],
  },
  {
    model: "claude-3-sonnet",
    provider: "ANTHROPIC",
    variations: ["claude-3-sonnet-20240229", "claude-3-5-sonnet-20240620"],
  },
  {
    model: "claude-3-haiku",
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
  {
    model: "anthropic/claude-3.5-sonnet",
    provider: "OPENROUTER",
    variations: ["anthropic/claude-3.5-sonnet"],
  },
] as const;

export const allModelVariations = modelNames.flatMap(
  (model) => model.variations
);

for (const model of modelNames) {
  if (!allProviders.includes(model.provider as any)) {
    throw new Error(`Provider ${model.provider} is not a valid provider`);
  }
}

export type ModelElement = (typeof modelNames)[number];
export type ModelName = (typeof modelNames)[number]["model"];
export type OpenStatsProviderName = (typeof modelNames)[number]["provider"];

// NOTE do not make any of these strings otherwise it will be a security risk
export type DataIsBeautifulRequestBody = {
  timespan: TimeSpan;
  models?: ModelName[];
  provider?: OpenStatsProviderName;
};

export type ModelBreakdown = {
  matched_model: string;
  percent: number;
};

export type ModelBreakdownOverTime = {
  date: string;
} & ModelBreakdown;

export type TTFTvsPromptLength = {
  ttft: number;
  ttft_p99: number;
  ttft_p75: number;
  ttft_normalized: number;
  ttft_normalized_p99: number;
  ttft_normalized_p75: number;
  prompt_length: number;
};

export type ModelCost = {
  matched_model: string;
  percent: number;
};

export type ProviderBreakdown = {
  provider: string;
  percent: number;
};

export type ProviderUsageOverTime = {
  provider: string;
  date: string;
  tokens: number;
};

export type ModelUsageOverTime = {
  model: string;
  date: string;
  tokens: number;
};

export type TotalValuesForAllOfTime = {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
};

@Route("v1/public/dataisbeautiful")
@Tags("DataIsBeautiful")
@Security("api_key")
export class DataIsBeautifulRouter extends Controller {
  @Post("/total-values")
  public async getTotalValues(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<TotalValuesForAllOfTime, string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult("total-values", async () =>
      dataIsBeautifulManager.getTotalValues()
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data!);
  }

  @Post("/model/usage/overtime")
  public async getModelUsageOverTime(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ModelUsageOverTime[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult("model-usage-overtime", async () =>
      dataIsBeautifulManager.getModelUsageOverTime()
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }

  @Post("/provider/usage/overtime")
  public async getProviderUsageOverTime(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ProviderUsageOverTime[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult("provider-usage-overtime", async () =>
      dataIsBeautifulManager.providerUsageOverTime()
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }

  @Post("/total-requests")
  public async getTotalRequests(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult(
      "total-requests" + JSON.stringify(requestBody),
      async () => dataIsBeautifulManager.getTotalRequests(requestBody)
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? 0);
  }

  @Post("/ttft-vs-prompt-length")
  public async getTTFTvsPromptInputLength(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<TTFTvsPromptLength[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult(
      "ttft-vs-prompt-length" + JSON.stringify(requestBody),
      async () => dataIsBeautifulManager.getTTFTvsPromptInputLength(requestBody)
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }

  @Post("/model/percentage")
  public async getModelPercentage(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ModelBreakdown[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult(
      "model-percentage" + JSON.stringify(requestBody),
      async () => dataIsBeautifulManager.getModelPercentage(requestBody)
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }

  @Post("/model/cost")
  public async getModelCost(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ModelCost[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult(
      "model-cost" + JSON.stringify(requestBody),
      async () => dataIsBeautifulManager.getModelCost(requestBody)
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }

  @Post("/provider/percentage")
  public async getProviderPercentage(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ProviderBreakdown[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult(
      "provider-percentage" + JSON.stringify(requestBody),
      async () => dataIsBeautifulManager.getProviderPercentage(requestBody)
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }

  @Post("/model/percentage/overtime")
  public async getModelPercentageOverTime(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ModelBreakdownOverTime[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await cacheResult(
      "model-percentage-overtime" + JSON.stringify(requestBody),
      async () =>
        await dataIsBeautifulManager.getModelPercentageOverTime(requestBody)
    );

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }
}
