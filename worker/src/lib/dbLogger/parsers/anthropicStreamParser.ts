import { consolidateTextFields, getUsage } from "./responseParserHelpers";

export async function anthropicAIStream(
  result: string,
  tokenCounter: (text: string) => Promise<number>,
  requestBody?: string
) {
  const lines = result
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => {
      if (line.includes("data:")) {
        return JSON.parse(line.replace("data:", ""));
      }
      return null;
    })
    .filter((line) => line !== null);
  const claudeData = {
    ...lines[lines.length - 1],
    completion: lines.map((d) => d.completion).join(""),
  };

  try {
    const completionTokens = await tokenCounter(claudeData.completion);
    const promptTokens = await tokenCounter(
      JSON.parse(requestBody ?? "{}")?.prompt ?? ""
    );
    return {
      data: {
        ...claudeData,
        streamed_data: result,
        usage: {
          total_tokens: completionTokens + promptTokens,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          helicone_calculated: true,
        },
      },
      error: null,
    };
  } catch (e) {
    console.error("Error parsing response", e);
    return {
      data: {
        streamed_data: result,
      },
      error: null,
    };
  }
}
