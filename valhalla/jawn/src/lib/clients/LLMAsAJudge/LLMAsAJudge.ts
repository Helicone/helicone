import { ExperimentDatasetRow } from "../../stores/experimentStore";
import { autoFillInputs } from "@helicone/prompts";
import { OPENROUTER_KEY, OPENROUTER_WORKER_URL } from "../constant";
import { generateTempHeliconeAPIKey } from "../../experiment/tempKeys/tempAPIKey";
import { OrganizationManager } from "../../../managers/organization/OrganizationManager";
import { err, ok, Result } from "../../shared/result";
import { tierHasFeature, TierId } from "../../../packages/common/features";

type EvaluatorScore = {
  score: number | boolean;
};
export type EvaluatorScoreResult = Result<EvaluatorScore, string>;

export class LLMAsAJudge {
  constructor(
    private params: {
      scoringType: "LLM-CHOICE" | "LLM-BOOLEAN" | "LLM-RANGE";
      llmTemplate: any;
      inputRecord: {
        inputs: Record<string, string>;
        autoInputs?: Record<string, string>;
      };
      outputBody: string;
      inputBody: string;
      promptTemplate: string;
      evaluatorName: string;
      organizationId: string;
    }
  ) {}

  private async evaluateChoice(result: any): Promise<EvaluatorScoreResult> {
    const evaluatorName = this.params.evaluatorName;
    const score = JSON.parse(
      result?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
    );

    if (Object.keys(score).length === 0) {
      return err("No score found");
    }
    if (evaluatorName in score) {
      return ok({ score: parseInt(score[evaluatorName]) });
    }
    return err(`No score found in ${JSON.stringify(score)}`);
  }

  private async evaluateBoolean(result: any): Promise<EvaluatorScoreResult> {
    const score = JSON.parse(
      result.choices[0].message.tool_calls[0].function.arguments
    );
    if (Object.keys(score).length === 0) {
      return err("No score found");
    }
    if (this.params.evaluatorName in score) {
      return ok(score[this.params.evaluatorName]);
    }
    return err(`No score found in ${JSON.stringify(score)}`);
  }

  private async evaluateRange(result: any): Promise<EvaluatorScoreResult> {
    const score = JSON.parse(
      result.choices[0].message.tool_calls[0].function.arguments
    );
    if (Object.keys(score).length === 0) {
      return err("No score found");
    }
    if (this.params.evaluatorName in score) {
      return ok({ score: parseInt(score[this.params.evaluatorName]) });
    }
    return err(`No score found in ${JSON.stringify(score)}`);
  }

  private async callLLM() {
    const requestBody = autoFillInputs({
      template: this.params.llmTemplate,
      inputs: {
        inputs:
          JSON.stringify(this.params.inputRecord?.inputs) +
          JSON.stringify(this.params.inputRecord?.autoInputs),
        outputBody: this.params.outputBody,
        inputBody: this.params.inputBody,
        promptTemplate: this.params.promptTemplate,
      },
      autoInputs: [],
    });

    const requestPath = `${OPENROUTER_WORKER_URL}/api/v1/chat/completions`;

    const heliconeApiKey = await generateTempHeliconeAPIKey(
      this.params.organizationId,
      "LLMAsAJudge"
    );

    const res = await heliconeApiKey.data?.with(async (apiKey) => {
      return await fetch(requestPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Helicone-Auth": `Bearer ${apiKey}`,
          "Helicone-Property-Helicone-Evaluator":
            this.params.evaluatorName ?? "deault-name",
        },
        body: JSON.stringify(requestBody),
      });
    });

    if (!res?.ok) {
      const body = await res?.text();
      console.error("error calling llm as a judge", res, body);
      throw new Error("error calling llm as a judge");
    }
    const data = await res.json();
    return data;
  }

  private async evaluateScore(): Promise<EvaluatorScoreResult> {
    const result = await this.callLLM();

    switch (this.params.scoringType) {
      case "LLM-CHOICE":
        return this.evaluateChoice(result);
      case "LLM-BOOLEAN":
        return this.evaluateBoolean(result);
      case "LLM-RANGE":
        return this.evaluateRange(result);
      default:
        throw new Error(`Unsupported scoring type: ${this.params.scoringType}`);
    }
  }

  async evaluate(): Promise<EvaluatorScoreResult> {
    const organizationManager = new OrganizationManager({
      organizationId: this.params.organizationId,
    });

    const org = await organizationManager.getOrg();
    if (
      !tierHasFeature(
        (org.data?.tier ?? "free") as TierId,
        "evals",
        org.data?.stripe_metadata as { addons?: { evals?: boolean } }
      )
    ) {
      return err("You are not authorized to use this evaluator");
    }

    try {
      return await this.evaluateScore();
    } catch (e) {
      return err(JSON.stringify(e));
    }
  }
}
