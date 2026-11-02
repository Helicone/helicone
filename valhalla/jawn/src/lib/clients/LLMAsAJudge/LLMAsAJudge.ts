import { autoFillInputs } from "@helicone/prompts";
import { orgHasPaidEvaluatorTier } from "../../../managers/evaluator/orgRateLimit";
import { err, ok, Result } from "../../../packages/common/result";
import { generateTempHeliconeAPIKey } from "../../experiment/tempKeys/tempAPIKey";
import { GET_KEY, OPENROUTER_WORKER_URL } from "../constant";
import { HeliconeManualLogger } from "@helicone/helpers";

type EvaluatorScore = {
  score: number | boolean;
};
export type EvaluatorScoreResult = Result<EvaluatorScore, string>;

/**
 * Models the LLM-as-a-judge evaluator may call. The request is paid for by
 * Helicone (OpenRouter key), so the model is never taken from the caller
 * without checking it against this list.
 */
export const LLM_JUDGE_ALLOWED_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-3.5-turbo",
] as const;

export const LLM_JUDGE_MAX_TOKENS = 1024;
const LLM_JUDGE_MAX_MESSAGES = 20;
const LLM_JUDGE_MAX_TOOL_SCHEMA_BYTES = 16 * 1024;
const LLM_JUDGE_MAX_BODY_BYTES = 1024 * 1024;
const LLM_JUDGE_TOOL_NAME = "scorer";
const ALLOWED_ROLES = new Set(["system", "user", "assistant"]);

type JudgeMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text"; text: string }>;
};

export interface SanitizedJudgeTemplate {
  model: string;
  max_tokens: number;
  temperature?: number;
  messages: JudgeMessage[];
  tool: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reduces a caller-supplied LLM template to the fields we allow, enforcing the
 * model allowlist, a max_tokens cap, text-only messages and exactly one
 * function tool. Everything else (stream, n, extra tools, images, provider
 * routing options, ...) is dropped.
 */
export function sanitizeJudgeTemplate(
  template: unknown
): Result<SanitizedJudgeTemplate, string> {
  if (!isPlainObject(template)) {
    return err("Invalid LLM template");
  }

  const model = template.model;
  if (
    typeof model !== "string" ||
    !(LLM_JUDGE_ALLOWED_MODELS as readonly string[]).includes(model)
  ) {
    return err(
      `Model not allowed for LLM evaluators. Allowed models: ${LLM_JUDGE_ALLOWED_MODELS.join(
        ", "
      )}`
    );
  }

  let maxTokens = LLM_JUDGE_MAX_TOKENS;
  if (typeof template.max_tokens === "number" && template.max_tokens > 0) {
    maxTokens = Math.min(Math.floor(template.max_tokens), LLM_JUDGE_MAX_TOKENS);
  }

  let temperature: number | undefined;
  if (
    typeof template.temperature === "number" &&
    Number.isFinite(template.temperature)
  ) {
    temperature = Math.min(Math.max(template.temperature, 0), 2);
  }

  if (
    !Array.isArray(template.messages) ||
    template.messages.length === 0 ||
    template.messages.length > LLM_JUDGE_MAX_MESSAGES
  ) {
    return err("Invalid LLM template messages");
  }

  const messages: JudgeMessage[] = [];
  for (const message of template.messages) {
    if (!isPlainObject(message) || !ALLOWED_ROLES.has(message.role)) {
      return err("Invalid LLM template messages");
    }
    if (typeof message.content === "string") {
      messages.push({ role: message.role, content: message.content });
    } else if (Array.isArray(message.content)) {
      const parts: Array<{ type: "text"; text: string }> = [];
      for (const part of message.content) {
        if (
          !isPlainObject(part) ||
          part.type !== "text" ||
          typeof part.text !== "string"
        ) {
          return err("LLM evaluator messages may only contain text");
        }
        parts.push({ type: "text", text: part.text });
      }
      messages.push({ role: message.role, content: parts });
    } else {
      return err("Invalid LLM template messages");
    }
  }

  const tools = template.tools;
  const fn = Array.isArray(tools) ? tools[0]?.function : undefined;
  if (
    !Array.isArray(tools) ||
    tools.length !== 1 ||
    tools[0]?.type !== "function" ||
    !isPlainObject(fn) ||
    !isPlainObject(fn.parameters) ||
    fn.parameters.type !== "object" ||
    !isPlainObject(fn.parameters.properties)
  ) {
    return err("LLM template must define exactly one scorer function tool");
  }

  const parameters = fn.parameters;
  if (JSON.stringify(parameters).length > LLM_JUDGE_MAX_TOOL_SCHEMA_BYTES) {
    return err("Scorer function schema too large");
  }

  return ok({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
    tool: {
      name: LLM_JUDGE_TOOL_NAME,
      description:
        typeof fn.description === "string"
          ? fn.description.slice(0, 1024)
          : "",
      parameters,
    },
  });
}

/**
 * Builds the request body sent to the provider. Only the message text is
 * filled from inputs; model, limits and the forced tool come from the
 * sanitized template so inputs can't change them.
 */
export function buildJudgeRequestBody(
  sanitized: SanitizedJudgeTemplate,
  inputs: Record<string, string>
): Result<Record<string, any>, string> {
  const filledMessages = autoFillInputs({
    template: sanitized.messages,
    inputs,
    autoInputs: [],
  });

  const body: Record<string, any> = {
    model: sanitized.model,
    messages: filledMessages,
    max_tokens: sanitized.max_tokens,
    tools: [
      {
        type: "function",
        function: sanitized.tool,
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: sanitized.tool.name },
    },
  };
  if (sanitized.temperature !== undefined) {
    body.temperature = sanitized.temperature;
  }

  if (JSON.stringify(body).length > LLM_JUDGE_MAX_BODY_BYTES) {
    return err("Evaluator input too large");
  }

  return ok(body);
}

/**
 * Extracts the scorer tool-call arguments. Never includes model output in the
 * error message.
 */
export function extractScorerArguments(
  result: any
): Result<Record<string, any>, string> {
  const toolCall = result?.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.name !== LLM_JUDGE_TOOL_NAME) {
    return err("No score found");
  }
  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    if (!isPlainObject(parsed) || Object.keys(parsed).length === 0) {
      return err("No score found");
    }
    return ok(parsed);
  } catch {
    return err("No score found");
  }
}

export class LLMAsAJudge {
  constructor(
    private params: {
      scoringType: "LLM-CHOICE" | "LLM-BOOLEAN" | "LLM-RANGE";
      llmTemplate: any;
      inputRecord: {
        inputs: Record<string, string>;
        autoInputs?: Record<string, string>;
      };
      outputBody: string;
      inputBody: string;
      promptTemplate: string;
      evaluatorName: string;
      organizationId: string;
    }
  ) {}

  private async evaluateChoice(result: any): Promise<EvaluatorScoreResult> {
    const score = extractScorerArguments(result);
    if (score.error || !score.data) {
      return err("No score found");
    }
    if (this.params.evaluatorName in score.data) {
      return ok({ score: parseInt(score.data[this.params.evaluatorName]) });
    }
    return err("No score found for evaluator");
  }

  private async evaluateBoolean(result: any): Promise<EvaluatorScoreResult> {
    const score = extractScorerArguments(result);
    if (score.error || !score.data) {
      return err("No score found");
    }
    if (this.params.evaluatorName in score.data) {
      return ok(score.data[this.params.evaluatorName]);
    }
    return err("No score found for evaluator");
  }

  private async evaluateRange(result: any): Promise<EvaluatorScoreResult> {
    const score = extractScorerArguments(result);
    if (score.error || !score.data) {
      return err("No score found");
    }
    if (this.params.evaluatorName in score.data) {
      return ok({ score: parseInt(score.data[this.params.evaluatorName]) });
    }
    return err("No score found for evaluator");
  }

  private async callLLM(
    requestBody: Record<string, any>
  ): Promise<Result<any, string>> {
    const requestPath = `${OPENROUTER_WORKER_URL}/api/v1/chat/completions`;

    // Server-internal: the key is only used here to log the judge call and is
    // never returned to a caller.
    const heliconeApiKey = await generateTempHeliconeAPIKey(
      this.params.organizationId,
      { kind: "server-internal" },
      "LLMAsAJudge"
    );

    const openrouterKey = await GET_KEY("key:openrouter");
    const heliconeOnHeliconeApiKey = await GET_KEY(
      "key:helicone_on_helicone_key"
    );
    const heliconeClient = new HeliconeManualLogger({
      apiKey: heliconeOnHeliconeApiKey,
    });
    const builder = heliconeClient.logBuilder(requestBody as any, {
      "Helicone-User-Id": this.params.organizationId,
      "Helicone-Property-Call-Area": "LLMAsAJudge",
    });
    const res = await heliconeApiKey.data?.with(async (apiKey) => {
      return await fetch(requestPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterKey}`,
          "Helicone-Auth": `Bearer ${apiKey}`,
          "Helicone-Property-Helicone-Evaluator":
            this.params.evaluatorName ?? "deault-name",
        },
        body: JSON.stringify(requestBody),
      });
    });

    if (!res?.ok) {
      const body = await res?.text();
      builder.setError(body);
      await builder.sendLog();
      console.error("error calling llm as a judge", { status: res?.status });
      return err("Error calling LLM evaluator");
    }
    const data = await res.json();
    builder.setResponse(JSON.stringify(data));
    await builder.sendLog();
    return ok(data);
  }

  private async evaluateScore(): Promise<EvaluatorScoreResult> {
    const sanitized = sanitizeJudgeTemplate(this.params.llmTemplate);
    if (sanitized.error || !sanitized.data) {
      return err(sanitized.error ?? "Invalid LLM template");
    }

    const body = buildJudgeRequestBody(sanitized.data, {
      inputs:
        JSON.stringify(this.params.inputRecord?.inputs) +
        JSON.stringify(this.params.inputRecord?.autoInputs),
      outputBody: this.params.outputBody,
      inputBody: this.params.inputBody,
      promptTemplate: this.params.promptTemplate,
    });
    if (body.error || !body.data) {
      return err(body.error ?? "Invalid LLM evaluator request");
    }

    const result = await this.callLLM(body.data);
    if (result.error) {
      return err(result.error);
    }

    switch (this.params.scoringType) {
      case "LLM-CHOICE":
        return this.evaluateChoice(result.data);
      case "LLM-BOOLEAN":
        return this.evaluateBoolean(result.data);
      case "LLM-RANGE":
        return this.evaluateRange(result.data);
      default:
        return err("Unsupported scoring type");
    }
  }

  async evaluate(): Promise<EvaluatorScoreResult> {
    if (!(await orgHasPaidEvaluatorTier(this.params.organizationId))) {
      return err("You are not authorized to use this evaluator");
    }

    try {
      return await this.evaluateScore();
    } catch (e) {
      console.error("LLM evaluator failed", e);
      return err("Failed to run LLM evaluator");
    }
  }
}
