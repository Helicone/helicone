import { HeliconeChatCreateParams, ValidationError } from "@helicone-package/prompts/types";
import { Env } from "../..";
import { HeliconePromptManager } from "@helicone-package/prompts/HeliconePromptManager";
import { getFromCache, storeInCache } from "../util/cache/secureCache";
import { PromptStore } from "../db/PromptStore";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import { err, isErr, ok, Result } from "../util/results";

export class PromptManager {
  constructor(private promptManager: HeliconePromptManager, private promptStore: PromptStore, private env: Env) {}


  async getSourcePromptBody(versionId: string, orgId: string) {
    const promptBody = await getFromCache({
      key: `prompt_body_${versionId}_${orgId}`,
      env: this.env,
    });
    if (!promptBody) {
      return null;
    }
    return JSON.parse(promptBody) as ChatCompletionCreateParams;
  }
  
  async getSourcePromptBodyWithFetch(
    params: HeliconeChatCreateParams,
    orgId: string
  ): Promise<Result<{
    promptVersionId: string,
    body: ChatCompletionCreateParams
  }, string>> {
    const versionIdResult = await this.promptStore.getPromptVersionId(params, orgId);
    if (isErr(versionIdResult)) return err(versionIdResult.error);

    const sourcePromptBody = await this.getSourcePromptBody(versionIdResult.data, orgId);
    if (!sourcePromptBody) {
      try {
        const sourcePromptBody = await this.promptManager.pullPromptBodyByVersionId(versionIdResult.data);
        
        await storeInCache(
          `prompt_body_${versionIdResult.data}_${orgId}`,
          JSON.stringify(sourcePromptBody),
          this.env
        );
        return ok({
          promptVersionId: versionIdResult.data,
          body: sourcePromptBody,
        });
      } catch (error) {
        return err(`Error retrieving prompt body: ${error}`);
      }
    }
    return ok({
      promptVersionId: versionIdResult.data,
      body: sourcePromptBody,
    });
  }

  async getMergedPromptBody(
    params: HeliconeChatCreateParams,
    orgId: string,
  ): Promise<Result<{ body: ChatCompletionCreateParams; errors: ValidationError[]; promptVersionId: string }, string>> {
    const result = await this.getSourcePromptBodyWithFetch(params, orgId);
    if (isErr(result)) return err(result.error);

    const mergedPromptBody = await this.promptManager.mergePromptBody(params, result.data.body);
    return ok({
      ...mergedPromptBody,
      promptVersionId: result.data.promptVersionId,
    });
  }

} 