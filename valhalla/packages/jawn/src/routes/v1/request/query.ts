import { Router } from "express";
import { dbExecute, withAuth } from "helicone-shared-ts";
import { paths } from "../../../schema/types";

import { SupabaseClient } from "@supabase/supabase-js";
import { RosettaWrapper } from "../../../lib/rosetta/rosettaWrapper";
import { Result, ok } from "helicone-shared-ts/dist/modules/result";
import { FilterNode } from "../../../filters/filterDefs";
import {
  SortLeafRequest,
  buildRequestSort,
} from "../../../lib/sorts/requests/sorts";
import { Database } from "helicone-shared-ts/dist/db/database.types";
import { buildFilterWithAuth } from "../../../filters/filters";

export type LlmType = "chat" | "completion";

interface Message {
  role?: string;
  content?: string;
  function_call?: FunctionCall;
}

interface FunctionCall {
  name?: string;
  arguments?: object;
}

interface Request {
  llm_type?: LlmType;
  model?: string;
  provider?: string;
  prompt?: string | null;
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  n?: number | null;
  stream?: boolean | null;
  stop?: string | null;
  presence_penalty?: number | null;
  frequency_penalty?: number | null;
  logprobs?: number | null;
  best_of?: number | null;
  logit_bias?: object | null;
  user?: string | null;
  messages?: Message[] | null;
  // Truncated state fields
  tooLarge?: boolean;
  heliconeMessage?: string;
}

interface Completion {
  [index: number]: string;
}

interface ErrorInfo {
  code?: string | null;
  message?: string | null;
}

interface Response {
  completions?: Completion[] | null;
  message?: Message | null;
  error?: ErrorInfo | null;
  model?: string | null;
  // Truncated state fields
  tooLarge?: boolean;
  heliconeMessage?: string;
}

export interface LlmSchema {
  request: Request;
  response?: Response | null;
}

export type Provider = "OPENAI" | "ANTHROPIC" | "CUSTOM";
const MAX_TOTAL_BODY_SIZE = 3900000 / 10;
const getModelFromPath = (path: string) => {
  let regex = /\/engines\/([^\/]+)/;
  let match = path.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return undefined;
  }
};
async function mapLLMCalls(
  heliconeRequests: HeliconeRequest[] | null,
  rosettaWrapper: RosettaWrapper
): Promise<Result<HeliconeRequest[], string>> {
  const promises =
    heliconeRequests?.map(async (heliconeRequest) => {
      // Extract the model from various possible locations.
      const model =
        heliconeRequest.response_body?.model ||
        heliconeRequest.request_body?.model ||
        heliconeRequest.response_body?.body?.model || // anthropic
        getModelFromPath(heliconeRequest.request_path) ||
        "";

      let mappedSchema: LlmSchema | null = null;
      try {
        const requestPath = new URL(heliconeRequest.request_path).pathname;
        const schemaJson = await rosettaWrapper.mapLLMCall(
          {
            request: {
              ...heliconeRequest.request_body,
              request_path: requestPath,
              model_best_guess: model,
            },
            response: heliconeRequest.response_body,
          },
          requestPath,
          heliconeRequest.provider,
          model
        );

        mappedSchema = JSON.parse(JSON.stringify(schemaJson)) as LlmSchema;
      } catch (error: any) {
        // Do nothing, FE will fall back to existing mappers
      }

      heliconeRequest.llmSchema = mappedSchema || null;

      return heliconeRequest;
    }) ?? [];

  return ok<HeliconeRequest[], string>(await Promise.all(promises));
}

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export interface HeliconeRequest {
  response_id: string;
  response_created_at: string;
  response_body?: any;
  response_status: number;
  request_id: string;
  request_created_at: string;
  request_body: any;
  request_path: string;
  request_user_id: string | null;
  request_properties: {
    [key: string]: Json;
  } | null;
  request_formatted_prompt_id: string | null;
  request_prompt_values: {
    [key: string]: Json;
  } | null;
  request_feedback: {
    [key: string]: Json;
  } | null;
  helicone_user: string | null;
  prompt_name: string | null;
  prompt_regex: string | null;
  key_name: string;
  request_prompt: string | null;
  response_prompt: string | null;
  delay_ms: number | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  provider: Provider;
  node_id: string | null;
  feedback_created_at?: string | null;
  feedback_id?: string | null;
  feedback_rating?: boolean | null;
  llmSchema: LlmSchema | null;
}

export async function getRequests(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafRequest,
  supabaseServer?: SupabaseClient<Database>
): Promise<Result<HeliconeRequest[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = await buildFilterWithAuth({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const sortSQL = buildRequestSort(sort);
  const query = `
  SELECT response.id AS response_id,
    response.created_at as response_created_at,
    response.body AS response_body,
    response.status AS response_status,
    request.id AS request_id,
    request.created_at as request_created_at,
    request.body AS request_body,
    request.path AS request_path,
    request.user_id AS request_user_id,
    request.properties AS request_properties,
    request.formatted_prompt_id as request_formatted_prompt_id,
    request.prompt_values as request_prompt_values,
    request.provider as provider,
    response.feedback as request_feedback,
    request.helicone_user as helicone_user,
    response.delay_ms as delay_ms,
    (response.prompt_tokens + response.completion_tokens) as total_tokens,
    response.completion_tokens as completion_tokens,
    response.prompt_tokens as prompt_tokens,
    prompt.name AS prompt_name,
    prompt.prompt AS prompt_regex,
    job_node_request.node_id as node_id,
    feedback.created_at AS feedback_created_at,
    feedback.id AS feedback_id,
    feedback.rating AS feedback_rating,
    (coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text as request_prompt,
    (coalesce(response.body ->'choices'->0->>'text', response.body ->'choices'->0->>'message'))::text as response_prompt
  FROM request
    left join response on request.id = response.request
    left join prompt on request.formatted_prompt_id = prompt.id
    left join feedback on response.id = feedback.response_id
    left join job_node_request on request.id = job_node_request.request_id
  WHERE (
    (${builtFilter.filter})
  )
  ${sortSQL !== undefined ? `ORDER BY ${sortSQL}` : ""}
  LIMIT ${limit}
  OFFSET ${offset}
`;

  const requests = await dbExecute<HeliconeRequest>(query, builtFilter.argsAcc);

  // const rosettaWrapper = new RosettaWrapper(supabaseServer);
  // const results = await mapLLMCalls(requests.data, rosettaWrapper);

  return requests;
}

const router = Router();

router.post(
  "/",
  withAuth<
    paths["/v1/request"]["post"]["requestBody"]["content"]["application/json"]
  >(async ({ request, res, supabaseClient, db }) => {
    // Handle your logic here
    const heliconeRequest = await request.getBody();
    const heliconeRequestID = heliconeRequest.request_id;
    const insertRequestResult = await db.insertRequest({
      body: heliconeRequest.body,
      createdAt: new Date(),
      requestReceivedAt: new Date(heliconeRequest.requestReceivedAt),
      heliconeApiKeyID: null,
      heliconeOrgID: supabaseClient.organizationId ?? null,
      heliconeProxyKeyID: null,
      id: heliconeRequestID,
      properties: heliconeRequest.properties,
      provider: heliconeRequest.provider,
      urlHref: heliconeRequest.url_href,
      userId: heliconeRequest.user_id ?? null,
      model: heliconeRequest.model ?? null,
    });
    if (insertRequestResult.error) {
      res.status(500).json({
        error: insertRequestResult.error,
        trace: "insertRequestResult.error",
      });
      return;
    }

    res.json({
      message: "Request received! :)",
      orgId: supabaseClient.organizationId,
      requestId: heliconeRequestID,
    });
  })
);

export default router;
