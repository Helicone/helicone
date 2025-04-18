import { consolidateTextFields, getUsage } from "./responseParserHelpers";

export async function parseOpenAIStream(
  result: string,
  tokenCounter: (text: string) => Promise<number>,
  requestBody?: string
) {
  const lines = result
    .split("\n")
    .filter((line) => !line.includes("OPENROUTER PROCESSING"))
    .filter((line) => line !== "");
  const data = lines.map((line, i) => {
    if (i === lines.length - 1) return {};
    try {
      return JSON.parse(line.replace("data:", ""));
    } catch (e) {
      console.error("Error parsing line", line);
      return {};
    }
  });

  try {
    return {
      data: {
        ...consolidateTextFields(data),
        usage: await getUsage(data, requestBody, () => Promise.resolve(0)),
      },
      error: null,
    };
  } catch (e) {
    console.error("Error parsing response", e);
    return {
      data: {
        streamed_data: data,
      },
      error: null,
    };
  }
}
