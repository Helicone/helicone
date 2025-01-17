import {
  EvaluatorManager,
  getEvaluatorScoreName,
} from "../../managers/evaluator/EvaluatorManager";
import { err, PromiseGenericResult } from "../shared/result";
import { OnlineEvalStore } from "../stores/OnlineEvalStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

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

      const properties = Object.keys(
        context.processedLog.request.properties ?? {}
      ).map((property) => property.toLowerCase());
      if (
        isNaN(sampleRate) ||
        sampleRate < 0 ||
        sampleRate > 100 ||
        Math.random() * 100 > sampleRate ||
        properties.includes("helicone-experiment-id") ||
        properties.includes("helicone-evaluator")
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

      const evaluatorManager = new EvaluatorManager({
        organizationId: context.authParams?.organizationId ?? "",
      });

      try {
        const result = await evaluatorManager.runLLMEvaluatorScore({
          evaluator: {
            code_template: onlineEval.evaluator_code_template,
            created_at: onlineEval.evaluator_created_at,
            id: onlineEval.evaluator_id,
            llm_template: onlineEval.evaluator_llm_template,
            name: onlineEval.evaluator_name,
            organization_id: context.authParams?.organizationId ?? "",
            scoring_type: onlineEval.evaluator_scoring_type,
            updated_at: "n/a",
          },
          inputRecord,
          request_id: context.message.log.request.id,
          requestBody: JSON.stringify(context.processedLog.request.body),
          responseBody: JSON.stringify(context.processedLog.response.body),
        });

        if (result.error) {
          console.error(result.error);
          continue;
        }

        const scoreName =
          getEvaluatorScoreName(onlineEval.evaluator_name) +
          (typeof result.data?.score === "boolean" ? "-hcone-bool" : "");

        context.processedLog.request.scores =
          context.processedLog.request.scores ?? {};
        context.processedLog.request.scores[scoreName] =
          result.data?.score ?? 0;
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
