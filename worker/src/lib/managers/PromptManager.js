import { getAndStoreInCache } from "../util/cache/secureCache";
import { err, isErr, ok } from "../util/results";
export class PromptManager {
    promptManager;
    promptStore;
    env;
    constructor(promptManager, promptStore, env) {
        this.promptManager = promptManager;
        this.promptStore = promptStore;
        this.env = env;
    }
    async getSourcePromptBodyWithFetch(params, orgId) {
        const versionIdResult = await this.promptStore.getPromptVersionId(params, orgId);
        if (isErr(versionIdResult))
            return err(versionIdResult.error);
        return await getAndStoreInCache(`prompt_body_${versionIdResult.data}_${orgId}`, this.env, async () => {
            try {
                const sourcePromptBody = await this.promptManager.pullPromptBodyByVersionId(versionIdResult.data);
                return ok({
                    promptVersionId: versionIdResult.data,
                    body: sourcePromptBody
                });
            }
            catch (error) {
                return err(`Error retrieving prompt body: ${error}`);
            }
        });
    }
    async getMergedPromptBody(params, orgId) {
        const result = await this.getSourcePromptBodyWithFetch(params, orgId);
        if (isErr(result))
            return err(result.error);
        const mergedPromptBody = await this.promptManager.mergePromptBody(params, result.data.body);
        return ok({
            ...mergedPromptBody,
            promptVersionId: result.data.promptVersionId,
        });
    }
}
