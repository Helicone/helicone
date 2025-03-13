import { Provider } from "@/packages/cost/unified/types";
import { StateInputs, StateParameters } from "@/types/prompt-state";

/**
 * Environment variables required for each provider
 */
export const providerEnvVars: Record<
  Provider,
  { name: string; vars: string[] }
> = {
  OPENAI: {
    name: "OpenAI",
    vars: ["OPENAI_API_KEY"],
  },
  AZURE: {
    name: "Azure OpenAI",
    vars: ["AZURE_API_KEY", "AZURE_ENDPOINT", "AZURE_DEPLOYMENT"],
  },
  ANTHROPIC: {
    name: "Anthropic",
    vars: ["ANTHROPIC_API_KEY"],
  },
  BEDROCK: {
    name: "AWS Bedrock",
    vars: ["BEDROCK_API_KEY", "BEDROCK_REGION"],
  },
  GOOGLE_GEMINI: {
    name: "Google Gemini",
    vars: ["GOOGLE_GEMINI_API_KEY"],
  },
  GOOGLE_VERTEXAI: {
    name: "Google Vertex AI",
    vars: [
      "GOOGLE_VERTEXAI_API_KEY",
      "GOOGLE_VERTEXAI_REGION",
      "GOOGLE_VERTEXAI_PROJECT",
      "GOOGLE_VERTEXAI_LOCATION",
    ],
  },
  OPENROUTER: {
    name: "OpenRouter",
    vars: ["OPENROUTER_API_KEY"],
  },
};

/**
 * Generate a .env file example based on the provider
 */
export const getEnvFileExample = (provider: Provider): string => {
  const allVars = ["HELICONE_API_KEY", ...providerEnvVars[provider].vars];
  return allVars.map((v) => `${v}=your-${v.toLowerCase()}`).join("\n");
};

/**
 * Generates code example for deploying a prompt from the Helicone Prompt Editor
 * using the @helicone/generate SDK
 */
export const getPromptDeploymentExample = (
  promptId: string,
  variables: StateInputs[] = [],
  parameters?: StateParameters
) => {
  // Format variables for code examples
  const hasVariables = variables.length > 0;
  const formattedVariables = variables
    .map((v) => `${v.name}: "${v.value || "value"}"`)
    .join(",\n    ");

  // Simple example
  const simpleExample = `import { generate } from "@helicone/generate";

// model, temperature, messages inferred from id
const response = await generate("${promptId}");

console.log(response);`;

  // With variables example
  const variablesExample = `import { generate } from "@helicone/generate";

const response = await generate({
  promptId: "${promptId}",
  inputs: {
    ${formattedVariables}
  }
});

console.log(response);`;

  // Chat example
  const chatExample = `import { generate } from "@helicone/generate";

const promptId = "${promptId}";
const chat = [];

// User
chat.push("can you help me with my homework?");

// Assistant
chat.push(await generate({ promptId, chat }));
console.log(chat[chat.length - 1]);

// User
chat.push("thanks, the first question is what is 2+2?");

// Assistant
chat.push(await generate({ promptId, chat }));
console.log(chat[chat.length - 1]);`;

  return {
    simpleExample,
    variablesExample,
    chatExample,
  };
};

/**
 * Generates a React component example for using the prompt
 */
export const getReactComponentExample = (
  promptId: string,
  variables: StateInputs[] = []
) => {
  // Format variables for code examples
  const hasVariables = variables.length > 0;
  const formattedVariables = variables
    .map((v) => `${v.name}: "${v.value || "value"}"`)
    .join(",\n      ");

  const formattedStateVariables = variables
    .map(
      (v) =>
        `const [${v.name}, set${
          v.name.charAt(0).toUpperCase() + v.name.slice(1)
        }] = useState("${v.value || "value"}");`
    )
    .join("\n  ");

  const formattedInputsObject = variables
    .map((v) => `      ${v.name}`)
    .join(",\n");

  return `
import { useState } from "react";
import { generate } from "@helicone/generate";

export function HeliconePromptComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  ${hasVariables ? formattedStateVariables : ""}

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const result = await generate({
        promptId: "${promptId}",${
    hasVariables
      ? `
        inputs: {
${formattedInputsObject}
        },`
      : ""
  }
      });
      setResponse(result);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Helicone Prompt</h2>
      ${
        hasVariables
          ? variables
              .map(
                (v) => `
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">${v.name}</label>
        <input
          type="text"
          value={${v.name}}
          onChange={(e) => set${
            v.name.charAt(0).toUpperCase() + v.name.slice(1)
          }(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>`
              )
              .join("")
          : ""
      }

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? "Generating..." : "Generate Response"}
      </button>

      {response && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-medium mb-2">Response:</h3>
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
}`;
};

/**
 * Generates a Node.js script example for using the prompt
 */
export const getNodeScriptExample = (
  promptId: string,
  variables: StateInputs[] = []
) => {
  // Format variables for code examples
  const formattedVariables = variables
    .map((v) => `${v.name}: "${v.value || "value"}"`)
    .join(",\n    ");

  return `
// Save as generate-prompt.js
import { generate } from "@helicone/generate";

async function main() {
  try {
    const response = await generate({
      promptId: "${promptId}",${
    variables.length > 0
      ? `
      inputs: {
        ${formattedVariables}
      },`
      : ""
  }
    });
    
    console.log("Generated response:");
    console.log(response);
  } catch (error) {
    console.error("Error generating response:", error);
  }
}

main();
`;
};
