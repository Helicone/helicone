// TOOLS ALLOWING THE AGENT TO INTERACT WITH HELICONE

// TOOLS ON /prompts
export const promptsTools = [
  {
    type: "function" as const,
    function: {
      name: "search-prompts",
      description: "Search for prompts by name or content",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to filter prompts",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get-prompts",
      description:
        "Gets the information of the prompts currently viewable in the prompts page.",
      parameters: {},
    },
  },
  {
    type: "function" as const,
    function: {
      name: "select-prompt",
      description:
        "Given an ID, opens a window showing the user details of the prompt. The window contains information like versions, environments, and metadata.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the prompt to select",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get-prompt-versions",
      description:
        "Gets the versions and accompanying metadata of a prompt given an ID.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the prompt to get versions for",
          },
        },
        required: ["id"],
      },
    },
  },
];
