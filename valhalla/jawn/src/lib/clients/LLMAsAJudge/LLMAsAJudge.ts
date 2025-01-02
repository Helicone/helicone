import { ExperimentDatasetRow } from "../../stores/experimentStore";
import { autoFillInputs } from "@helicone/prompts";
import { OPENROUTER_KEY, OPENROUTER_WORKER_URL } from "../constant";
import { generateTempHeliconeAPIKey } from "../../experiment/tempKeys/tempAPIKey";
import { OrganizationManager } from "../../../managers/organization/OrganizationManager";
import { err, ok, Result } from "../../shared/result";

type Score = {
  score: number | boolean;
};
type ScoreResult = Result<Score, string>;

const TIERS = ["pro-20240913", "enterprise"];

export class LLMAsAJudge {
  constructor(
    private params: {
      scoringType: "LLM-CHOICE" | "LLM-BOOLEAN" | "LLM-RANGE";
      llmTemplate: any;
      inputRecord: {
        inputs: Record<string, string>;
        autoInputs?: Record<string, string>;
      };
      output: string;
      evaluatorName: string;
      organizationId: string;
    }
  ) {}

  private async evaluateChoice(result: any): Promise<Score> {
    const evaluatorName = this.params.evaluatorName;
    const score = JSON.parse(
      result?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
    )?.[evaluatorName];
    return {
      score: parseInt(score),
    };
  }

  private async evaluateBoolean(result: any): Promise<Score> {
    return {
      score: JSON.parse(
        result.choices[0].message.tool_calls[0].function.arguments
      )?.[this.params.evaluatorName],
    };
  }

  private async evaluateRange(result: any): Promise<Score> {
    return {
      score: JSON.parse(
        result.choices[0].message.tool_calls[0].function.arguments
      )?.[this.params.evaluatorName],
    };
  }

  private async callLLM() {
    const requestBody = autoFillInputs({
      template: this.params.llmTemplate,
      inputs: {
        inputs:
          JSON.stringify(this.params.inputRecord?.inputs) +
          JSON.stringify(this.params.inputRecord?.autoInputs),
        outputs: this.params.output,
      },
      autoInputs: [],
    });

    const requestPath = `${OPENROUTER_WORKER_URL}/api/v1/chat/completions`;

    const heliconeApiKey = await generateTempHeliconeAPIKey(
      this.params.organizationId,
      "LLMAsAJudge"
    );
    console.log("OPENROUTER_KEY", OPENROUTER_KEY);

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

  private async evaluateScore(): Promise<Score> {
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

  async evaluate(): Promise<ScoreResult> {
    const organizationManager = new OrganizationManager({
      organizationId: this.params.organizationId,
    });

    const org = await organizationManager.getOrg();
    if (!TIERS.includes(org.data?.tier ?? "")) {
      return err("You are not authorized to use this evaluator");
    }

    try {
      return ok(await this.evaluateScore());
    } catch (e) {
      return err(JSON.stringify(e));
    }
  }
}
