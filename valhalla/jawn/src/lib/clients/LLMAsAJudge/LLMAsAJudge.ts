import { ExperimentDatasetRow } from "../../stores/experimentStore";
import { autoFillInputs } from "@helicone/prompts";
import { OPENROUTER_KEY, OPENROUTER_WORKER_URL } from "../constant";
import { generateTempHeliconeAPIKey } from "../../experiment/tempKeys/tempAPIKey";

interface ScoreResult {
  score: number | boolean;
}

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

  private async evaluateChoice(result: any): Promise<ScoreResult> {
    const evaluatorName = this.params.evaluatorName;
    const score = JSON.parse(
      result?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
    )?.[evaluatorName];
    return {
      score: parseInt(score),
    };
  }

  private async evaluateBoolean(result: any): Promise<ScoreResult> {
    return {
      score: JSON.parse(
        result.choices[0].message.tool_calls[0].function.arguments
      )?.[this.params.evaluatorName],
    };
  }

  private async evaluateRange(result: any): Promise<ScoreResult> {
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

  async evaluate(): Promise<ScoreResult> {
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
}
