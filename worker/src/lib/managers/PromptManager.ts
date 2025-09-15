import { HeliconePromptManager } from "@helicone-package/prompts/HeliconePromptManager";
import {
  HeliconeChatCreateParams,
  ValidationError,
} from "@helicone-package/prompts/types";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import { PromptStore } from "../db/PromptStore";
import { getAndStoreInCache } from "../util/cache/secureCache";
import { err, isError, ok, Result } from "@helicone/gateway";

export class PromptManager {
  constructor(
    private promptManager: HeliconePromptManager,
    private promptStore: PromptStore,
    private env: Env
  ) {}

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
    const versionIdResult = await this.promptStore.getPromptVersionId(
      params,
      orgId
    );
    if (isError(versionIdResult)) return err(versionIdResult.error);

    return await getAndStoreInCache(
      `prompt_body_${versionIdResult.data}_${orgId}`,
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
      undefined,
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
    if (isError(result)) return err(result.error);

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
