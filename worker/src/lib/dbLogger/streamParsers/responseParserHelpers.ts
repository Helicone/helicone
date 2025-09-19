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
