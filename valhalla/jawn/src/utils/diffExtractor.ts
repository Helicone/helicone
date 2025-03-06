import path from "path";
import { Project, SourceFile } from "ts-morph";

export const extractAstTransformations = (message: string): any[] => {
  try {
    const jsonRegex = /```json\s*([\s\S]*?)```/g;
    let match;
    const transformations: any[] = [];

    while ((match = jsonRegex.exec(message)) !== null) {
      try {
        const jsonContent = match[1].trim();
        const parsedJson = JSON.parse(jsonContent);
        if (parsedJson && parsedJson.file && parsedJson.transformations) {
          // Remove leading slash from file path if present
          if (parsedJson.file.startsWith("/")) {
            parsedJson.file = parsedJson.file.substring(1);
          }

          // Process add_env_variable transformations to ensure they have the right format
          if (parsedJson.transformations) {
            parsedJson.transformations = parsedJson.transformations.map(
              (transform: any) => {
                if (
                  transform.type === "add_env_variable" &&
                  transform.variable &&
                  !transform.variable_name
                ) {
                  // Convert the new format to the format expected by the text transformer
                  return {
                    type: "add_env_variable",
                    variable_name: transform.variable,
                    variable_value:
                      transform.value || "your_helicone_api_key_here",
                  };
                }

                // Handle array content in add_env_variable
                if (
                  transform.type === "add_env_variable" &&
                  Array.isArray(transform.content)
                ) {
                  return {
                    type: "add_env_variable",
                    variable_name: "HELICONE_API_KEY",
                    variable_value: "",
                  };
                }

                // Handle array content in add_section
                if (
                  transform.type === "add_section" &&
                  Array.isArray(transform.content)
                ) {
                  transform.content = transform.content.join("\n");
                }

                return transform;
              }
            );
          }

          transformations.push(parsedJson);
        }
      } catch (e) {
        console.error("Failed to parse JSON from Greptile response:", e);
      }
    }

    // If no AST transformations found, try to extract them from code blocks
    if (transformations.length === 0) {
      console.log(
        "No AST transformations found, attempting to convert code blocks to AST format"
      );

      // Try to identify files and code changes from the message
      const fileRegex =
        /(?:Current code in|Suggested transformation for|File:|```typescript file=")([^"\n]+)(?:"|:)/g;
      const codeBlockRegex =
        /```(?:typescript|javascript)\s*(?:file="[^"]+")?\s*([\s\S]*?)```/g;
      const envVarRegex =
        /Add to your (?:existing )?environment configuration[\s\S]*?```(?:\w*)\s*([\s\S]*?)```/;

      // Extract file paths
      const filePaths: Set<string> = new Set();
      while ((match = fileRegex.exec(message)) !== null) {
        let filePath = match[1].trim();
        // Remove leading slash if present
        if (filePath.startsWith("/")) {
          filePath = filePath.substring(1);
        }
        if (filePath) {
          filePaths.add(filePath);
        }
      }

      // Process each identified file
      filePaths.forEach((filePath) => {
        // Create a file transformation object
        const fileTransformation: {
          file: string;
          transformations: any[];
        } = {
          file: filePath,
          transformations: [],
        };

        // Look for code blocks related to this file
        // This is a heuristic approach - we're looking for code blocks that appear after the file path
        const fileContentRegex = new RegExp(
          `(?:Current code in|Suggested transformation for|File:|\`\`\`typescript file=")${filePath.replace(
            /\//g,
            "\\/"
          )}(?:"|:)[\\s\\S]*?\`\`\`(?:typescript|javascript)\\s*(?:file="[^"]+")?\s*([\\s\\S]*?)\`\`\``,
          "g"
        );

        let codeMatch;
        while ((codeMatch = fileContentRegex.exec(message)) !== null) {
          const codeContent = codeMatch[1].trim();

          // Analyze code to determine what kind of transformation it is
          if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
            // For TypeScript/JavaScript files
            // Look for API client initialization
            if (
              codeContent.includes("export const") &&
              (codeContent.includes("apiKey") ||
                codeContent.includes("API_KEY"))
            ) {
              // Extract variable names and corresponding create functions
              const apiVarRegex = /export const (\w+)\s*=\s*create(\w+)\({/g;
              let apiVarMatch;

              while ((apiVarMatch = apiVarRegex.exec(codeContent)) !== null) {
                const varName = apiVarMatch[1]; // e.g., "openrouter"
                const createFnName = `create${apiVarMatch[2]}`; // e.g., "createOpenRouter"

                // Add object property transformation for Helicone headers
                fileTransformation.transformations.push({
                  type: "add_object_property",
                  target: {
                    type: "variable_declaration",
                    name: varName,
                    object_name: createFnName,
                  },
                  property_name: "headers",
                  property_value:
                    '{\n  "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,\n  "Helicone-Cache-Enabled": "true"\n}',
                });
              }

              // Add validation code after imports if needed
              if (
                fileTransformation.transformations.length > 0 &&
                !message.includes("if (!process.env.HELICONE_API_KEY)")
              ) {
                fileTransformation.transformations.push({
                  type: "add_code_after_imports",
                  code: '// Helicone API key validation\nif (!process.env.HELICONE_API_KEY) {\n  throw new Error("HELICONE_API_KEY is required for API monitoring");\n}',
                });
              }
            }
          }
        }

        // Only add the file transformation if we found transformations for it
        if (fileTransformation.transformations.length > 0) {
          transformations.push(fileTransformation);
        }
      });

      // Look for environment variable changes
      const envMatch = envVarRegex.exec(message);
      if (envMatch) {
        const envContent = envMatch[1].trim();
        const envVarMatch = /HELICONE_API_KEY=([^\n]+)/.exec(envContent);

        if (envVarMatch) {
          transformations.push({
            file: ".env.example",
            transformations: [
              {
                type: "add_env_variable",
                variable_name: "HELICONE_API_KEY",
                variable_value: envVarMatch[1] || "your_helicone_api_key_here",
              },
            ],
          });
        }
      }
    }

    return transformations;
  } catch (error) {
    console.error("Error extracting AST transformations:", error);
    return [];
  }
};

export const getFeatureName = (featureId: string): string => {
  // Map feature IDs to their display names
  const featureMap: Record<string, string> = {
    // Provider features
    openai: "OpenAI",
    anthropic: "Anthropic",
    azure: "Azure OpenAI",
    perplexity: "Perplexity",
    openrouter: "OpenRouter",
    cohere: "Cohere",
    claude: "Claude",
    llamafile: "Llamafile",
    "helicone-proxy": "Helicone Proxy",
    "together-ai": "Together AI",
    "google-ai": "Google AI",
    mistral: "Mistral AI",
    ollama: "Ollama",

    // Helicone features
    caching: "Caching",
    "custom-properties": "Custom Properties",
    prompts: "Prompts",
    "rate-limits": "Rate Limits",
    retries: "Retries",
    security: "Security",
    sessions: "Sessions",
    "user-metrics": "User Metrics",
  };

  // Return the mapped name or transform the ID to a readable format
  return (
    featureMap[featureId] ||
    featureId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};
