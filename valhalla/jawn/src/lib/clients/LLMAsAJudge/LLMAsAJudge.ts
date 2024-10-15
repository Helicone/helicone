import { prepareRequestOpenAIOnPremFull } from "../../experiment/requestPrep/openai";
import { prepareRequestOpenAIFull } from "../../experiment/requestPrep/openaiCloud";
import { ExperimentDatasetRow } from "../../stores/experimentStore";
import { autoFillInputs, formatPrompt } from "@helicone/prompts";

interface ScoreResult {
  score: number | boolean;
}

export class LLMAsAJudge {
  constructor(
    private params: {
      openAIApiKey: string;
      scoringType: "LLM-CHOICE" | "LLM-BOOLEAN" | "LLM-RANGE";
      llmTemplate: any;
      inputRecord: ExperimentDatasetRow["inputRecord"];
      output: string;
      evaluatorName: string;
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
          JSON.stringify(this.params.inputRecord.inputs) +
          JSON.stringify(this.params.inputRecord.autoInputs),
        outputs: this.params.output,
      },
      autoInputs: [],
    });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.params.openAIApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    return await res.json();
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
