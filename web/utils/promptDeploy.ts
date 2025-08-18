import { providerConfigs } from "@helicone-package/cost/unified/providers";
import { Provider, ProviderConfig } from "@helicone-package/cost/unified/types";
import { StateInputs, StateParameters } from "@/types/prompt-state";
import { logger } from "@/lib/telemetry/logger";

/**
 * Environment variables required for each provider
 */
export const providerEnvVars: Record<Provider, { vars: string[] }> =
  Object.fromEntries(
    Object.entries(providerConfigs as Record<Provider, ProviderConfig>).map(
      ([provider, config]) => [
        provider as Provider,
        {
          vars: config.envVars,
        },
      ],
    ),
  ) as Record<Provider, { vars: string[] }>;

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
  parameters?: StateParameters,
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

logger.info({ response }, "Generated response");`;

  // With variables example
  const variablesExample = `import { generate } from "@helicone/generate";

const response = await generate({
  promptId: "${promptId}",
  inputs: {
    ${formattedVariables}
  }
});

logger.info({ response }, "Generated response");`;

  // Chat example
  const chatExample = `import { generate } from "@helicone/generate";

const promptId = "${promptId}";
const chat = [];

// User
chat.push("can you help me with my homework?");

// Assistant
chat.push(await generate({ promptId, chat }));
logger.info({ response: chat[chat.length - 1] }, "Chat response");

// User
chat.push("thanks, the first question is what is 2+2?");

// Assistant
chat.push(await generate({ promptId, chat }));
logger.info({ response: chat[chat.length - 1] }, "Chat response");`;

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
  variables: StateInputs[] = [],
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
        }] = useState("${v.value || "value"}");`,
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
      logger.error({ error }, "Error generating response");
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
      </div>`,
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
  variables: StateInputs[] = [],
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
    console.log({ response }, "Response");
  } catch (error) {
    console.error("Error generating response", { error }, "Error generating response");
  }
}

main();
`;
};
