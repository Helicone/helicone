import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { err, ok, PromiseGenericResult } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { sanitizeObject } from "../../utils/sanitize";
import { OnlineEvalStore } from "../stores/OnlineEvalStore";
import { LLMAsAJudge } from "../clients/LLMAsAJudge/LLMAsAJudge";
import { OPENAI_KEY } from "../clients/constant";
import { getEvaluatorScoreName } from "../../managers/evaluator/EvaluatorManager";

export class OnlineEvalHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const orgId = context.orgParams?.id;
    if (!orgId) {
      return err(`Org ID not found in context`);
    }

    const onlineEvalStore = new OnlineEvalStore(orgId);
    const onlineEvals = await onlineEvalStore.getOnlineEvalsByOrgId(orgId);

    if (onlineEvals.error) {
      return err(onlineEvals.error);
    }

    for (const onlineEval of onlineEvals.data ?? []) {
      const sampleRate = Number(
        (onlineEval.config as any)?.["sampleRate"] ?? 100
      );

      if (
        isNaN(sampleRate) ||
        sampleRate < 0 ||
        sampleRate > 100 ||
        Math.random() * 100 > sampleRate ||
        (context.processedLog.request.properties &&
          "Helicone-Experiment-Id" in context.processedLog.request.properties)
      ) {
        continue;
      }

      const propertyFilters = ((onlineEval.config as any)?.[
        "propertyFilters"
      ] ?? []) as {
        key: string;
        value: string;
      }[];

      const shouldOnlineEvalProperties = propertyFilters.every(
        (propertyFilter) =>
          context.processedLog.request.properties?.[propertyFilter.key] ===
          propertyFilter.value
      );

      if (!shouldOnlineEvalProperties) {
        continue;
      }

      const inputRecord = {
        inputs: context.processedLog.request.heliconeTemplate?.inputs ?? {},
        autoInputs:
          context.processedLog.request.heliconeTemplate?.autoInputs ?? {},
      } as {
        inputs: Record<string, string>;
        autoInputs?: Record<string, string>;
      };

      const llmAsAJudge = new LLMAsAJudge({
        openAIApiKey: OPENAI_KEY!,
        scoringType: onlineEval.evaluator_scoring_type as
          | "LLM-CHOICE"
          | "LLM-BOOLEAN"
          | "LLM-RANGE",
        llmTemplate: onlineEval.evaluator_llm_template,
        inputRecord,
        output: JSON.stringify(context.processedLog.response.body),
        evaluatorName: onlineEval.evaluator_name,
      });

      try {
        const result = await llmAsAJudge.evaluate();

        const scoreName =
          getEvaluatorScoreName(onlineEval.evaluator_name) +
          (typeof result.score === "boolean" ? "-hcone-bool" : "");

        context.processedLog.request.scores =
          context.processedLog.request.scores ?? {};
        context.processedLog.request.scores[scoreName] = result.score ?? 0;
        context.processedLog.request.scores_evaluatorIds =
          context.processedLog.request.scores_evaluatorIds ?? {};
        context.processedLog.request.scores_evaluatorIds[scoreName] =
          onlineEval.evaluator_id;
      } catch (e) {
        console.error(e);
      }
    }

    return await super.handle(context);
  }
}
