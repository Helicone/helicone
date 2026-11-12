import {
  EvaluatorManager,
  getEvaluatorScoreName,
  getFullEvaluatorScoreName,
} from "../../managers/evaluator/EvaluatorManager";
import { isPythonEvaluator } from "../../managers/evaluator/pythonEvaluator";
import { cacheResultCustom } from "../../utils/cacheResult";
import { KVCache } from "../cache/kvCache";
import { err, PromiseGenericResult } from "../../packages/common/result";
import { OnlineEvalStore } from "../stores/OnlineEvalStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext, toHeliconeRequest } from "./HandlerContext";

const kvCache = new KVCache(60); // 1 minutes

let loggedPythonEvaluatorSkip = false;

/** Python evaluators are retired; note it once per process, not per log. */
function logPythonEvaluatorSkipOnce() {
  if (loggedPythonEvaluatorSkip) {
    return;
  }
  loggedPythonEvaluatorSkip = true;
  console.log(
    "Skipping python online evaluators: python evaluators are no longer supported"
  );
}

export class OnlineEvalHandler extends AbstractLogHandler {
  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });

    const orgId = context.orgParams?.id;
    if (!orgId) {
      return err(`Org ID not found in context`);
    }

    const onlineEvalStore = new OnlineEvalStore(orgId);
    const hasOnlineEvals = await cacheResultCustom(
      "has-online-evals-" + orgId,
      async () => await onlineEvalStore.hasOnlineEvals(orgId),
      kvCache
    );

    if (hasOnlineEvals.data === false) {
      return await super.handle(context);
    }

    const onlineEvals = await onlineEvalStore.getOnlineEvalsByOrgId(orgId);

    if (onlineEvals.error) {
      return err(onlineEvals.error);
    }

    for (const onlineEval of onlineEvals.data ?? []) {
      if (
        isPythonEvaluator({
          scoring_type: onlineEval.evaluator_scoring_type,
          code_template: onlineEval.evaluator_code_template,
          llm_template: onlineEval.evaluator_llm_template,
          last_mile_config: onlineEval.last_mile_config,
        })
      ) {
        logPythonEvaluatorSkipOnce();
        continue;
      }

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
            last_mile_config: onlineEval.last_mile_config,
          },
          inputRecord,
          request_id: context.message.log.request.id,
          requestBody: context.processedLog.request.body,
          responseBody: context.processedLog.response.body,
          heliconeRequest: toHeliconeRequest(context),
        });

        if (result.error) {
          console.error(result.error);
          continue;
        }

        const scoreName = getFullEvaluatorScoreName(onlineEval.evaluator_name);

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
