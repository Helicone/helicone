import { HeliconePromptManager } from "@helicone-package/prompts/HeliconePromptManager";
import {
  HeliconeChatCreateParams,
  HeliconePromptParams,
  ValidationError,
} from "@helicone-package/prompts/types";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import { PromptStore } from "../db/PromptStore";
import { getAndStoreInCache } from "../util/cache/secureCache";
import { err, isErr, ok, Result } from "../util/results";
import { ResponsesRequestBody } from "@helicone-package/llm-mapper/transform/types/responses";
import { toChatCompletions } from "@helicone-package/llm-mapper/transform/providers/responses/request/toChatCompletions";
import { fromChatCompletions } from "@helicone-package/llm-mapper/transform/providers/responses/request/fromChatCompletions";

export class PromptManager {
  constructor(
    private promptManager: HeliconePromptManager,
    private promptStore: PromptStore,
    private env: Env
  ) {}

  private buildPromptVersionCacheKey(
    params: HeliconePromptParams,
    orgId: string
  ): string | null {
    if (!params.prompt_id) {
      return null;
    }

    const scope = params.environment
      ? `env:${params.environment}`
      : params.version_id
      ? `version:${params.version_id}`
      : "prod";

    return `prompt_version_${params.prompt_id}_${scope}_${orgId}`;
  }

  private buildPromptModelCacheKey(
    params: HeliconePromptParams,
    orgId: string
  ): string | null {
    if (!params.prompt_id) {
      return null;
    }

    const scope = params.environment
      ? `env:${params.environment}`
      : params.version_id
      ? `version:${params.version_id}`
      : "prod";

    return `prompt_model_${params.prompt_id}_${scope}_${orgId}`;
  }

  private buildPromptBodyCacheKey(
    promptId: string,
    versionId: string,
    orgId: string
  ): string {
    return `prompt_body_${promptId}_${versionId}_${orgId}`;
  }

  private async getPromptVersionIdWithCache(
    params: HeliconePromptParams,
    orgId: string
  ): Promise<Result<string, string>> {
    const cacheKey = this.buildPromptVersionCacheKey(params, orgId);
    if (!cacheKey) {
      return this.promptStore.getPromptVersionId(params, orgId);
    }

    return await getAndStoreInCache(
      cacheKey,
      this.env,
      async () => {
        return this.promptStore.getPromptVersionId(params, orgId);
      },
      300,
      false
    );
  }

  /**
   * Gets the model associated with a prompt version, with caching.
   * This allows requests to omit the model field when using a prompt_id,
   * as the model will be fetched from the stored prompt version.
   */
  async getModelFromPrompt(
    params: HeliconePromptParams,
    orgId: string
  ): Promise<Result<string, string>> {
    const cacheKey = this.buildPromptModelCacheKey(params, orgId);
    if (!cacheKey) {
      return this.promptStore.getModelFromPrompt(params, orgId);
    }

    return await getAndStoreInCache(
      cacheKey,
      this.env,
      async () => {
        return this.promptStore.getModelFromPrompt(params, orgId);
      },
      300,
      false
    );
  }

  async getSourcePromptBodyWithFetch(
    params: HeliconePromptParams,
    orgId: string
  ): Promise<
    Result<
      {
        promptVersionId: string;
        body: ChatCompletionCreateParams;
      },
      string
    >
  > {
    const versionIdResult = await this.getPromptVersionIdWithCache(
      params,
      orgId
    );
    if (isErr(versionIdResult)) return err(versionIdResult.error);

    const promptId = params.prompt_id;
    if (!promptId) {
      return err("No prompt ID provided");
    }

    return await getAndStoreInCache(
      this.buildPromptBodyCacheKey(
        promptId,
        versionIdResult.data,
        orgId
      ),
      this.env,
      async () => {
        try {
          const sourcePromptBody =
            await this.promptManager.pullPromptBodyByVersionId(
              versionIdResult.data
            );
          return ok({
            promptVersionId: versionIdResult.data,
            body: sourcePromptBody,
          });
        } catch (error) {
          return err(`Error retrieving prompt body: ${error}`);
        }
      },
      300,
      false
    );
  }

  async getMergedPromptBody(
    params: HeliconeChatCreateParams,
    orgId: string
  ): Promise<
    Result<
      {
        body: ChatCompletionCreateParams;
        errors: ValidationError[];
        promptVersionId: string;
      },
      string
    >
  > {
    const result = await this.getSourcePromptBodyWithFetch(params, orgId);
    if (isErr(result)) return err(result.error);

    const promptPartials = this.promptManager.extractPromptPartials(result.data.body);
    const promptPartialInputs: Record<string, any> = {};
    for (const promptPartial of promptPartials) {
      const sourceBodyOfPartial = await this.getSourcePromptBodyWithFetch({
        prompt_id: promptPartial.prompt_id,
        environment: promptPartial.environment,
      }, orgId);
      if (isErr(sourceBodyOfPartial)) return err(sourceBodyOfPartial.error);

      const substitutionValue = this.promptManager.getPromptPartialSubstitutionValue(
        promptPartial,
        sourceBodyOfPartial.data.body
      );

      promptPartialInputs[promptPartial.raw] = substitutionValue;
    }

    const mergedPromptBody = await this.promptManager.mergePromptBody(
      params,
      result.data.body,
      promptPartialInputs
    );
    return ok({
      ...mergedPromptBody,
      promptVersionId: result.data.promptVersionId,
    });
  }

  /**
   * Merges a Responses API request with a prompt stored in Chat Completions format.
   *
   * Flow:
   * 1. Fetch source prompt (Chat Completions format)
   * 2. Convert Responses API request to Chat Completions format
   * 3. Merge using existing Chat Completions merge logic
   * 4. Convert merged result back to Responses API format
   */
  async getMergedPromptBodyForResponses(
    params: ResponsesRequestBody & HeliconePromptParams,
    orgId: string
  ): Promise<
    Result<
      {
        body: ResponsesRequestBody;
        errors: ValidationError[];
        promptVersionId: string;
      },
      string
    >
  > {
    // 1. Fetch source prompt (same as existing logic)
    const result = await this.getSourcePromptBodyWithFetch(params, orgId);
    if (isErr(result)) return err(result.error);

    // 2. Handle prompt partials (same as existing logic)
    const promptPartials = this.promptManager.extractPromptPartials(result.data.body);
    const promptPartialInputs: Record<string, any> = {};
    for (const promptPartial of promptPartials) {
      const sourceBodyOfPartial = await this.getSourcePromptBodyWithFetch({
        prompt_id: promptPartial.prompt_id,
        environment: promptPartial.environment,
      }, orgId);
      if (isErr(sourceBodyOfPartial)) return err(sourceBodyOfPartial.error);

      const substitutionValue = this.promptManager.getPromptPartialSubstitutionValue(
        promptPartial,
        sourceBodyOfPartial.data.body
      );

      promptPartialInputs[promptPartial.raw] = substitutionValue;
    }

    // 3. Convert Responses API request to Chat Completions format
    // Strip instructions before conversion - we don't want it to become a system message
    // It will be preserved in the final output via the originalResponsesBody parameter
    const { instructions: _instructions, ...paramsWithoutInstructions } = params;

    // Only convert input to messages if there's actual input
    const hasInput =
      typeof params.input === "string"
        ? params.input !== ""
        : Array.isArray(params.input)
        ? params.input.length > 0
        : params.input !== undefined && params.input !== null;
    const paramsToConvert: ResponsesRequestBody = {
      ...paramsWithoutInstructions,
      // If no input, use empty array so no user messages are added
      input: hasInput ? params.input : [],
    };

    const chatParams = toChatCompletions(paramsToConvert);

    // 4. Merge using existing Chat Completions merge logic
    const mergedPromptBody = await this.promptManager.mergePromptBody(
      {
        ...chatParams,
        inputs: params.inputs,
        prompt_id: params.prompt_id,
        version_id: params.version_id,
        environment: params.environment,
      } as HeliconeChatCreateParams,
      result.data.body,
      promptPartialInputs
    );

    // 5. Convert merged result back to Responses API format
    // Pass original params to preserve Responses-specific fields (instructions, metadata, etc.)
    const responsesBody = fromChatCompletions(
      mergedPromptBody.body as HeliconeChatCreateParams,
      params
    );

    return ok({
      body: responsesBody,
      errors: mergedPromptBody.errors,
      promptVersionId: result.data.promptVersionId,
    });
  }
}
