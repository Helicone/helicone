import { HeliconePromptManager } from "@helicone-package/prompts/HeliconePromptManager";
import {
  HeliconeChatCreateParams,
  ValidationError,
} from "@helicone-package/prompts/types";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import { PromptStore } from "../db/PromptStore";
import { getAndStoreInCache } from "../util/cache/secureCache";
import { err, isErr, ok, Result } from "../util/results";

export class PromptManager {
  constructor(
    private promptManager: HeliconePromptManager,
    private promptStore: PromptStore,
    private env: Env
  ) {}

  private buildPromptVersionCacheKey(
    params: HeliconeChatCreateParams,
    orgId: string
  ): string | null {
    if (!params.prompt_id) {
      return null;
    }

    const scope = params.version_id
      ? `version:${params.version_id}`
      : params.environment
      ? `env:${params.environment}`
      : "prod";

    return `prompt_version_${params.prompt_id}_${scope}_${orgId}`;
  }

  private buildPromptBodyCacheKey(
    promptId: string,
    versionId: string,
    orgId: string
  ): string {
    return `prompt_body_${promptId}_${versionId}_${orgId}`;
  }

  private async getPromptVersionIdWithCache(
    params: HeliconeChatCreateParams,
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

  async getSourcePromptBodyWithFetch(
    params: HeliconeChatCreateParams,
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

    const mergedPromptBody = await this.promptManager.mergePromptBody(
      params,
      result.data.body
    );
    return ok({
      ...mergedPromptBody,
      promptVersionId: result.data.promptVersionId,
    });
  }
}
