// TOOLS ALLOWING THE AGENT TO INTERACT WITH HELICONE

// TOOLS ON /playground
export const playgroundTools = [
  {
    type: "function" as const,
    function: {
      name: "get-messages",
      description:
        "Gets the messages in the playground with IDs for each message. Always use this before editing a message to get the ID. Returns a JSON string of the messages.",
      parameters: {},
    },
  },
  {
    type: "function" as const,
    function: {
      name: "edit-playground-message",
      description: "Inputs text to edit a certain message in the playground.",
      parameters: {
        type: "object",
        properties: {
          message_index: {
            type: "number",
            description: "The index of the message to edit",
          },
          content_array_index: {
            type: "number",
            description:
              "For messages that are content arrays, this is the index of the content array to edit",
          },
          text: {
            type: "string",
            description: "The text to edit the message with",
          },
        },
        required: ["message_index", "text"],
      },
    },
  },
];

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
