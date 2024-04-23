import { Database } from "../db/database.types";
import { PromptStore } from "../stores/PromptStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class PromptHandler extends AbstractLogHandler {
  private promtStore: PromptStore;

  constructor(promptStore: PromptStore) {
    super();
    this.promtStore = promptStore;
  }

  // Checks if promp exists, if not, add to batch
  public async handle(context: HandlerContext): Promise<void> {
    if (!context.orgParams?.id || !context.message.log.request.promptId) {
      // If the orgParams or promptId is not present, we can't do anything
      return super.handle(context);
    }

    const existingPrompt = await this.promtStore.getPromptById(
      context.orgParams.id,
      context.message.log.request.promptId
    );

    if (existingPrompt.error) {
      console.error(
        `Error getting prompt: ${existingPrompt.error} for prompt ${context.message.log.request.promptId}`
      );
      // If there was an error, stop processing
      return;
    }

    if (!existingPrompt.data) {
      // If the prompt does not exist, add it to the batch
      const newPrompt: Database["public"]["Tables"]["prompt_v2"]["Insert"] = {
        id: crypto.randomUUID(),
        organization: context.orgParams.id,
        user_defined_id: context.message.log.request.promptId,
      };
      context.payload.prompts.push(newPrompt);
    }

    const existingPromptVersion =
      await this.promtStore.getPromptVersionByPromptId();
  }
}
