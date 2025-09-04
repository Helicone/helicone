import { getTotalSavingsClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { modelCost } from "@helicone-package/cost/costCalc";
import { Result, resultMap } from "@/packages/common/result";
import { TimeFilterSchema } from "@helicone-package/filters/helpers";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const parsedBody = TimeFilterSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ error: parsedBody.error.message, data: null });
  }

  res.status(200).json(
    resultMap(
      await getTotalSavingsClickhouse(orgId, parsedBody.data.timeFilter),
      (modelMetrics) =>
        modelMetrics.reduce(
          (acc, modelMetric) =>
            acc +
            modelCost({
              provider: modelMetric.provider,
              model: modelMetric.model,
              sum_prompt_tokens: modelMetric.sum_prompt_tokens,
              sum_completion_tokens: modelMetric.sum_completion_tokens,
              prompt_cache_write_tokens: modelMetric.prompt_cache_write_tokens,
              prompt_cache_read_tokens: modelMetric.prompt_cache_read_tokens,
              prompt_audio_tokens: modelMetric.prompt_audio_tokens,
              completion_audio_tokens: modelMetric.completion_audio_tokens,
            }),
          0,
        ),
    ),
  );
}

export default withAuth(handler);
