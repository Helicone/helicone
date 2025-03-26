export function consolidateTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (cur?.usage) {
        return recursivelyConsolidate(acc, { usage: cur.usage });
      } else if (acc?.choices === undefined) {
        return cur;
      } else {
        // This is to handle the case if the choices array is empty (happens on Azure)
        if (acc.choices.length === 0 && cur.choices?.length !== 0) {
          acc.choices.push(...cur.choices.slice(acc.choices.length));
        }

        // Preserve x_groq field if it contains usage data
        if (cur?.x_groq?.usage) {
          acc.x_groq = cur.x_groq;
        }

        if ("model" in cur && "model" in acc) {
          if (!acc.model) {
            acc.model = cur.model;
          }
        }

        if ("id" in cur && "id" in acc) {
          if (!acc.id) {
            acc.id = cur.id;
          }
        }
        return {
          ...acc,
          choices: acc.choices?.map((c: any, i: number) => {
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
                  tool_calls: c.delta.tool_calls
                    ? recursivelyConsolidate(
                        c.delta.tool_calls,
                        cur.choices[i].delta.tool_calls ?? {}
                      )
                    : cur.choices[i].delta.tool_calls,
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

    consolidated.choices = consolidated.choices?.map((c: any) => {
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

export function recursivelyConsolidate(body: any, delta: any): any {
  Object.keys(delta).forEach((key) => {
    if (body[key] === undefined || body[key] === null) {
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

export function consolidateGoogleTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (!acc.candidates) {
        return cur;
      } else {
        if (cur.candidates) {
          acc.candidates = acc.candidates.map((c: any, i: number) => {
            if (!cur.candidates[i]) {
              return c;
            } else if (c.content && cur.candidates[i].content) {
              c.content.parts = c.content.parts.map((part: any, j: number) => {
                if (cur.candidates[i].content.parts[j]) {
                  part.text = part.text
                    ? part.text +
                      (cur.candidates[i].content.parts[j].text ?? "")
                    : cur.candidates[i].content.parts[j].text;
                }
                return part;
              });
              return c;
            } else {
              return c;
            }
          });
        } else if (cur.candidates) {
          // Handle the case where acc has no candidates but cur has
          acc.candidates = cur.candidates;
        }

        if (cur.usageMetadata && acc.usageMetadata) {
          acc.usageMetadata.promptTokenCount = Math.max(
            acc.usageMetadata.promptTokenCount,
            cur.usageMetadata.promptTokenCount
          );
          acc.usageMetadata.candidatesTokenCount = Math.max(
            acc.usageMetadata.candidatesTokenCount,
            cur.usageMetadata.candidatesTokenCount
          );
          acc.usageMetadata.totalTokenCount = Math.max(
            acc.usageMetadata.totalTokenCount,
            cur.usageMetadata.totalTokenCount
          );
        } else if (cur.usageMetadata) {
          // Handle the case where acc has no usageMetadata but cur has
          acc.usageMetadata = cur.usageMetadata;
        }
        return acc;
      }
    }, {});

    return consolidated;
  } catch (e) {
    console.error("Error consolidating text fields", e);
    return responseBody[0];
  }
}
