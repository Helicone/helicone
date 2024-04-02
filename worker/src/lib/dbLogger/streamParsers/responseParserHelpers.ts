/* eslint-disable @typescript-eslint/no-explicit-any */
export function recursivelyConsolidate(body: any, delta: any): any {
  Object.keys(delta).forEach((key) => {
    if (body[key] === undefined) {
      body[key] = delta[key];
    } else if (typeof body[key] === "object") {
      recursivelyConsolidate(body[key], delta[key]);
    } else if (typeof body[key] === "number") {
      body[key] += delta[key];
    } else if (typeof body[key] === "string") {
      body[key] += delta[key];
    } else {
      throw new Error("Invalid function call type");
    }
  });
  return body;
}

export function consolidateTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (acc.choices === undefined) {
        return cur;
      } else {
        // This is to handle the case if the choices array is empty (happens on Azure)
        if (acc.choices.length === 0 && cur.choices?.length !== 0) {
          acc.choices.push(...cur.choices.slice(acc.choices.length));
        }
        return {
          ...acc,
          choices: acc.choices.map((c: any, i: number) => {
            if (!cur.choices) {
              return c;
            } else if (
              c.delta !== undefined &&
              cur.choices[i]?.delta !== undefined
            ) {
              return {
                delta: {
                  ...c.delta,
                  content: c.delta.content
                    ? c.delta.content + (cur.choices[i].delta.content ?? "")
                    : cur.choices[i].delta.content,
                  function_call: c.delta.function_call
                    ? recursivelyConsolidate(
                        c.delta.function_call,
                        cur.choices[i].delta.function_call ?? {}
                      )
                    : cur.choices[i].delta.function_call,
                },
              };
            } else if (
              c.text !== undefined &&
              cur.choices[i]?.text !== undefined
            ) {
              return {
                ...c,
                text: c.text + (cur.choices[i].text ?? ""),
              };
            } else {
              return c;
            }
          }),
        };
      }
    }, {});

    consolidated.choices = consolidated.choices.map((c: any) => {
      if (c.delta !== undefined) {
        return {
          ...c,
          // delta: undefined,
          message: {
            ...c.delta,
            content: c.delta.content,
          },
        };
      } else {
        return c;
      }
    });
    return consolidated;
  } catch (e) {
    console.error("Error consolidating text fields", e);
    return responseBody[0];
  }
}

export async function getUsage(
  streamedData: any[],
  requestBody: any,
  tokenCounter: (text: string) => Promise<number>
): Promise<{
  total_tokens: number;
  completion_tokens: number;
  prompt_tokens: number;
  helicone_calculated: boolean;
}> {
  try {
    const responseTokenCount = await tokenCounter(
      streamedData
        .filter((d) => "id" in d)
        .map((d) => getResponseText(d))
        .join("")
    );
    const requestTokenCount = await getRequestTokenCount(
      JSON.parse(requestBody),
      tokenCounter
    );
    const totalTokens = requestTokenCount + responseTokenCount;
    return {
      total_tokens: totalTokens,
      completion_tokens: responseTokenCount,
      prompt_tokens: requestTokenCount,
      helicone_calculated: true,
    };
  } catch (e) {
    console.error("Error getting usage", e);
    return {
      total_tokens: -1,
      completion_tokens: -1,
      prompt_tokens: -1,
      helicone_calculated: false,
    };
  }
}

function getResponseText(responseBody: any): string {
  type Choice =
    | {
        delta: {
          content: string;
        };
      }
    | {
        text: string;
      };
  if (responseBody.choices !== undefined) {
    const choices = responseBody.choices;
    return (choices as Choice[])
      .map((c) => {
        if ("delta" in c) {
          return c.delta.content;
        } else if ("text" in c) {
          return c.text;
        } else {
          throw new Error("Invalid choice type");
        }
      })
      .join("");
  } else {
    throw new Error(`Invalid response body:\n${JSON.stringify(responseBody)}`);
  }
}

async function getRequestTokenCount(
  requestBody: any,
  tokenCounter: (text: string) => Promise<number>
): Promise<number> {
  if (requestBody.prompt !== undefined) {
    const prompt = requestBody.prompt;
    if (typeof prompt === "string") {
      return tokenCounter(requestBody.prompt);
    } else if ("length" in prompt) {
      return tokenCounter((prompt as string[]).join(""));
    } else {
      throw new Error("Invalid prompt type");
    }
  } else if (requestBody.messages !== undefined) {
    const messages = requestBody.messages as { content: string }[];

    let totalTokenCount = 0;

    for (const message of messages) {
      const tokenCount = await tokenCounter(message.content);
      totalTokenCount += tokenCount;
    }

    return totalTokenCount + 3 + messages.length * 5;
  } else {
    throw new Error(`Invalid request body:\n${JSON.stringify(requestBody)}`);
  }
}
