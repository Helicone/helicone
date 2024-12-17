import { BaseTempKey } from "../../experiment/tempKeys/baseTempKey";
import { ExperimentDatasetRow } from "../../stores/experimentStore";
import { autoFillInputs } from "@helicone/prompts";
import { generateHeliconeAPIKey } from "../../experiment/tempKeys/tempAPIKey";
import { Result } from "../../shared/result";

interface ScoreResult {
  score: number | boolean;
}

export class LLMAsAJudge {
  constructor(
    private params: {
      openAIApiKey: string;
      scoringType: "LLM-CHOICE" | "LLM-BOOLEAN" | "LLM-RANGE";
      llmTemplate: any;
      inputRecord: {
        inputs: Record<string, string>;
        autoInputs?: Record<string, string>;
      };
      output: string;
      evaluatorName: string;
      organizationId: string;
      evaluatorId: string;
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

    const tempKey: Result<BaseTempKey, string> = await generateHeliconeAPIKey(
      this.params.organizationId
    );

    if (tempKey.error || !tempKey.data) {
      throw new Error("Error generating temp key");
    }

    return tempKey.data.with<Result<string, string>>(async (secretKey) => {
      const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL ?? "";
      console.log("heliconeWorkerUrl", heliconeWorkerUrl);
      const res = await fetch(`${heliconeWorkerUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Helicone-Auth": `Bearer ${secretKey}`,
          Authorization: `Bearer ${this.params.openAIApiKey}`,
          "Helicone-Eval-Id": this.params.evaluatorId,
          "Helicone-Manual-Access-Key":
            process.env.HELICONE_MANUAL_ACCESS_KEY ?? "",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        console.error("error calling llm as a judge", res);
        throw new Error("error calling llm as a judge");
      }
      const data = await res.json();
      return data;
    });
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
