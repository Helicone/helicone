import { AuthParams } from "../../lib/db/supabase";
import { Result, resultMap } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";
import { RequestManager } from "../request/RequestManager";
import OpenAI from "openai";
import { generateRequestFiltersSchema, getFinalPrompt } from "./jsonSchema";
import { RequestFilterBranch } from "../../controllers/public/requestController";
import {
  FilterLeafSubset,
  FilterNode,
} from "../../lib/shared/filters/filterDefs";
import {
  printRunnableQuery,
  dbQueryClickhouse,
} from "../../lib/shared/db/dbExecute";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";
import { isValidTimeZoneDifference } from "../../utils/helpers";
import moment from "moment";

export interface GeneratedChart {
  chartType: "line" | "bar" | "pie";
  data: any[];
}

type GeneratedQuery = {
  query: string;
  params: {
    name: string;
    parameterType: string;
  }[];
  chartType: "line" | "bar" | "pie";
};

export class GenUiManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }
  public async genearteChart(
    prompt: string
  ): Promise<Result<GeneratedChart, string>> {
    const generatedQuerry = await this.generateClickhouseQuery(
      prompt,
      `WHERE default.request_response_versioned.organization_id = '${this.authParams.organizationId}'`
    );
    if (!generatedQuerry.data || generatedQuerry.error) {
      return { data: null, error: "Error generating chart" };
    }

    const clickhouseData = await dbQueryClickhouse<any[]>(
      generatedQuerry.data?.query,
      []
    );

    if (!clickhouseData.data || clickhouseData.error) {
      return { data: null, error: "Error fetching data from Clickhouse" };
    }
    console.log("filter", generatedQuerry.data);
    return {
      data: {
        chartType: generatedQuerry.data.chartType,
        //@ts-ignore
        data: clickhouseData.data.filter((x) => x.name !== "") ?? [],
      },
      error: null,
    };
  }

  private async generateClickhouseQuery(
    prompt: string,
    additionalParams: string
  ): Promise<Result<GeneratedQuery, string>> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const heliconeApiKey = process.env.HELICONE_API_KEY;
    const openai = new OpenAI({
      baseURL: "https://oai.hconeai.com/v1",
      apiKey: openaiApiKey,
      defaultHeaders: {
        "Helicone-Auth": `Bearer ${heliconeApiKey}`,
      },
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: getFinalPrompt(prompt, additionalParams),
        },
      ],
      tools: generateRequestFiltersSchema,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    const toolCalls = responseMessage.tool_calls;
    if (toolCalls) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        if (functionName === "generate-clickhouse-sql-query") {
          return { data: functionArgs as GeneratedQuery, error: null };
        }
      }
    } else {
      console.error(`No tool calls found in the response `);
    }
    return { data: null, error: "Error" };
  }
}
