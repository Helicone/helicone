// Test the consolidateTextFields function with Responses API support
// This is a copy of the function from streamParser.ts to test it independently
function recursivelyConsolidate(body: any, delta: any): any {
  Object.keys(delta).forEach((key) => {
    if (body[key] === undefined || body[key] === null) {
      body[key] = delta[key];
    } else if (typeof body[key] === "object") {
      recursivelyConsolidate(body[key], delta[key]);
    } else if (typeof body[key] === "number") {
      body[key] += delta[key];
    } else if (typeof body[key] === "string") {
      body[key] += delta[key];
    }
  });
  return body;
}

function consolidateTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (acc?.choices === undefined && acc?.item === undefined) {
        return cur;
      } else if (cur?.item?.content) {
        // Handle OpenAI Responses API format (streaming with item.content)
        if (!acc.item) {
          acc.item = { content: [] };
        }
        if (!Array.isArray(acc.item.content)) {
          acc.item.content = [];
        }

        // Merge item properties
        if (cur.item.id) acc.item.id = cur.item.id;
        if (cur.item.role) acc.item.role = cur.item.role;
        if (cur.item.status) acc.item.status = cur.item.status;

        // Consolidate content array
        cur.item.content.forEach((newContent: any) => {
          if (newContent.type === "output_text") {
            const existingText = acc.item.content.find(
              (c: any) => c.type === "output_text"
            );
            if (existingText) {
              existingText.text = (existingText.text || "") + (newContent.text || "");
            } else {
              acc.item.content.push({ ...newContent });
            }
          } else {
            // For other content types, just add them if not already present
            const exists = acc.item.content.some(
              (c: any) => c.type === newContent.type && c.id === newContent.id
            );
            if (!exists) {
              acc.item.content.push({ ...newContent });
            }
          }
        });

        // Handle usage data
        if (cur.usage) {
          acc.usage = cur.usage;
        }

        return acc;
      } else if (cur?.choices) {
        // Chat Completions API - simplified version for test
        return {
          ...acc,
          choices: acc.choices?.map((c: any, i: number) => {
            if (!cur.choices) return c;
            else if (c.delta !== undefined && cur.choices[i]?.delta !== undefined) {
              return {
                delta: {
                  ...c.delta,
                  content: c.delta.content
                    ? c.delta.content + (cur.choices[i].delta.content ?? "")
                    : cur.choices[i].delta.content,
                },
              };
            }
            return c;
          }),
        };
      } else if (cur?.usage) {
        return recursivelyConsolidate(acc, { usage: cur.usage });
      } else {
        return acc;
      }
    }, {});

    // Post-process choices array (Chat Completions API)
    if (consolidated.choices) {
      consolidated.choices = consolidated.choices?.map((c: any) => {
        if (c.delta !== undefined) {
          return {
            ...c,
            message: {
              ...c.delta,
              content: c.delta.content,
            },
          };
        } else {
          return c;
        }
      });
    }

    return consolidated;
  } catch (e) {
    console.error("Error consolidating text fields", e);
    return responseBody[0];
  }
}

describe("OpenAI Responses API Stream Consolidation", () => {
  it("should consolidate streamed output_text content", () => {
    const streamChunks = [
      {
        item: {
          id: "resp-001",
          role: "assistant",
          status: "in_progress",
          content: [
            {
              type: "output_text",
              text: "The capital",
            },
          ],
        },
      },
      {
        item: {
          content: [
            {
              type: "output_text",
              text: " of France",
            },
          ],
        },
      },
      {
        item: {
          content: [
            {
              type: "output_text",
              text: " is Paris.",
            },
          ],
        },
      },
      {
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      },
    ];

    const result = consolidateTextFields(streamChunks);

    expect(result.item).toBeDefined();
    expect(result.item.id).toBe("resp-001");
    expect(result.item.role).toBe("assistant");
    expect(result.item.content).toHaveLength(1);
    expect(result.item.content[0].type).toBe("output_text");
    expect(result.item.content[0].text).toBe("The capital of France is Paris.");
    expect(result.usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 8,
      total_tokens: 18,
    });
  });

  it("should handle multiple content types in Responses API stream", () => {
    const streamChunks = [
      {
        item: {
          id: "resp-002",
          role: "assistant",
          content: [
            {
              type: "output_text",
              text: "Here is",
            },
          ],
        },
      },
      {
        item: {
          content: [
            {
              type: "output_text",
              text: " an image:",
            },
          ],
        },
      },
      {
        item: {
          content: [
            {
              type: "output_image",
              id: "img-001",
              image_url: "https://example.com/image.jpg",
            },
          ],
        },
      },
    ];

    const result = consolidateTextFields(streamChunks);

    expect(result.item.content).toHaveLength(2);
    expect(result.item.content[0].type).toBe("output_text");
    expect(result.item.content[0].text).toBe("Here is an image:");
    expect(result.item.content[1].type).toBe("output_image");
    expect(result.item.content[1].id).toBe("img-001");
  });

  it("should still handle Chat Completions API format", () => {
    const streamChunks = [
      {
        id: "chatcmpl-001",
        choices: [
          {
            delta: {
              content: "Hello",
            },
            index: 0,
          },
        ],
      },
      {
        choices: [
          {
            delta: {
              content: " world",
            },
            index: 0,
          },
        ],
      },
    ];

    const result = consolidateTextFields(streamChunks);

    expect(result.choices).toBeDefined();
    expect(result.choices[0].message.content).toBe("Hello world");
  });

  it("should handle empty Responses API stream", () => {
    const streamChunks = [
      {
        item: {
          id: "resp-003",
          role: "assistant",
          content: [],
        },
      },
    ];

    const result = consolidateTextFields(streamChunks);

    expect(result.item).toBeDefined();
    expect(result.item.id).toBe("resp-003");
    expect(result.item.content).toHaveLength(0);
  });
});
