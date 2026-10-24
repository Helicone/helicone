import { consolidateTextFields } from "./responseParserHelpers";

export async function parseOpenAIStream(result: string) {
  const lines = result
    .split("\n")
    .filter((line) => !line.includes("OPENROUTER PROCESSING"))
    .filter((line) => line !== "");
  const data = lines.map((line, i) => {
    if (i === lines.length - 1) return {};
    try {
      return JSON.parse(line.replace("data:", ""));
    } catch {
      console.error("Error parsing OpenAI stream line");
      return {};
    }
  });

  try {
    return {
      data: {
        ...consolidateTextFields(data),
        usage: {
          total_tokens: -1,
          completion_tokens: -1,
          prompt_tokens: -1,
          helicone_calculated: false,
        },
      },
      error: null,
    };
  } catch {
    console.error("Error consolidating OpenAI stream");
    return {
      data: {
        streamed_data: data,
      },
      error: null,
    };
  }
}
