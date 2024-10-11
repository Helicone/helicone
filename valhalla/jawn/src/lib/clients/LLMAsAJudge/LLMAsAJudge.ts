import { prepareRequestOpenAIOnPremFull } from "../../experiment/requestPrep/openai";
import { prepareRequestOpenAIFull } from "../../experiment/requestPrep/openaiCloud";
import { ExperimentDatasetRow } from "../../stores/experimentStore";
import { autoFillInputs, formatPrompt } from "@helicone/prompts";

export class LLMAsAJudge {
  constructor(private openAIApiKey: string) {}

  async evaluate(
    template: any,
    inputRecord: ExperimentDatasetRow["inputRecord"],
    output: string
  ) {
    const requestBody = autoFillInputs({
      template,
      inputs: {
        inputs:
          JSON.stringify(inputRecord.inputs) +
          JSON.stringify(inputRecord.autoInputs),
        outputs: output,
      },
      autoInputs: [],
    });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openAIApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    return await res.json();
  }
}
