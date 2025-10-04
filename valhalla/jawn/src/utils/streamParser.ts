export function consolidateTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (acc?.choices === undefined) {
        return cur;
      } else if (cur?.choices) {
        // This is to handle the case if the choices array is empty (happens on Azure)
        if (acc.choices.length === 0 && cur.choices?.length !== 0) {
          acc.choices.push(...cur.choices.slice(acc.choices.length));
        }

        // Preserve x_groq field if it contains usage data
        if (cur?.x_groq?.usage) {
          acc.x_groq = cur.x_groq;
        }

        // Handle usage data in chunks that also have choices (Google AI Studio chat completions endpoint)
        if (cur?.usage) {
          acc.usage = cur.usage;
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
                        cur.choices[i].delta.function_call ?? {},
                      )
                    : cur.choices[i].delta.function_call,
                  tool_calls: c.delta.tool_calls
                    ? recursivelyConsolidateToolCalls(
                        c.delta.tool_calls,
                        cur.choices[i].delta.tool_calls ?? [],
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
      } else if (cur?.usage) {
        // usage-only chunk
        return recursivelyConsolidate(acc, { usage: cur.usage });
      } else if (cur?.response?.usage) {
        return recursivelyConsolidate(acc, { usage: cur.response.usage });
      } else {
        return acc;
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

export function recursivelyConsolidateToolCalls(
  existingToolCalls: any[],
  newToolCalls: any[],
): any[] {
  if (!existingToolCalls || existingToolCalls.length === 0) {
    return newToolCalls || [];
  }

  if (!newToolCalls || newToolCalls.length === 0) {
    return existingToolCalls;
  }

  const finalToolCalls: { [key: number]: any } = {};

  // Initialize with existing tool calls
  existingToolCalls.forEach((toolCall) => {
    if (toolCall.index !== undefined) {
      finalToolCalls[toolCall.index] = { ...toolCall };
    }
  });

  // Process new tool calls
  newToolCalls.forEach((toolCall) => {
    const { index } = toolCall;

    if (!finalToolCalls[index]) {
      // New tool call
      finalToolCalls[index] = { ...toolCall };
    } else {
      // Existing tool call - consolidate
      const existing = finalToolCalls[index];

      // Merge function arguments if both have function data
      if (toolCall.function && existing.function) {
        if (!existing.function.arguments) {
          existing.function.arguments = "";
        }
        if (toolCall.function.arguments) {
          existing.function.arguments += toolCall.function.arguments;
        }
      } else if (toolCall.function) {
        // If existing doesn't have function but new one does
        existing.function = toolCall.function;
      }

      // Merge other fields
      if (toolCall.id && !existing.id) {
        existing.id = toolCall.id;
      }
      if (toolCall.type && !existing.type) {
        existing.type = toolCall.type;
      }
    }
  });

  // Convert back to array and sort by index
  return Object.values(finalToolCalls).sort((a, b) => a.index - b.index);
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
            cur.usageMetadata.promptTokenCount,
          );
          acc.usageMetadata.candidatesTokenCount = Math.max(
            acc.usageMetadata.candidatesTokenCount,
            cur.usageMetadata.candidatesTokenCount,
          );
          acc.usageMetadata.totalTokenCount = Math.max(
            acc.usageMetadata.totalTokenCount,
            cur.usageMetadata.totalTokenCount,
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
