import fs from "fs";
import path from "path";

// Define the HeliconeFeature interface directly in this file
export interface HeliconeFeature {
  id: string;
  name: string;
  description: string;
  promptFile: string;
}

export class FeaturePromptService {
  private promptsDir: string;

  constructor(promptsDir: string = path.join(process.cwd(), "src", "prompts")) {
    this.promptsDir = promptsDir;
  }

  /**
   * Reads the content of a prompt file
   * @param fileName The name of the prompt file
   * @returns The content of the prompt file
   */
  private readPromptFile(fileName: string): string {
    try {
      const filePath = path.join(this.promptsDir, fileName);
      return fs.readFileSync(filePath, "utf8");
    } catch (error) {
      console.error(`Error reading prompt file ${fileName}:`, error);
      return "";
    }
  }

  /**
   * Generates a comprehensive prompt for Greptile based on the selected features
   * @param features Array of selected Helicone features
   * @param codeContext Additional context about the codebase (optional)
   * @returns A formatted prompt for Greptile
   */
  public generateGreptilePrompt(
    features: HeliconeFeature[],
    codeContext: string = ""
  ): string {
    // Start with a base prompt
    let prompt = `# Helicone Integration

I need to integrate Helicone with my application to add observability and advanced features to my LLM usage. Please implement the following Helicone features:

`;

    // Add each selected feature to the prompt
    features.forEach((feature) => {
      prompt += `## ${feature.name}\n\n`;

      // Add the content of the feature's prompt file
      const featurePrompt = this.readPromptFile(feature.promptFile);
      prompt += `${featurePrompt}\n\n`;
    });

    // Add instructions for Greptile
    prompt += `# Implementation Instructions

1. Analyze my codebase to identify where LLM API calls are made.
2. Modify these calls to use Helicone's proxy endpoints.
3. Add the necessary headers and configuration for each selected feature.
4. Ensure all imports and dependencies are properly updated.
5. Maintain the existing functionality while adding these new features.

${codeContext ? `# Additional Context\n\n${codeContext}\n` : ""}

Please provide a unified diff that I can apply to my codebase to implement these features.`;

    return prompt;
  }

  /**
   * Generates a comprehensive prompt for Greptile that includes provider-specific instructions
   * @param features Array of selected Helicone features
   * @param codeContext Additional context about the codebase (optional)
   * @returns A formatted prompt for Greptile with provider-specific instructions
   */
  public generateProviderSpecificPrompt(
    features: HeliconeFeature[],
    codeContext: string = ""
  ): string {
    // Read the introduction and output format
    const introContent = this.readPromptFile("heliconeGeneralIntegration.md");
    const outputFormatContent = this.readPromptFile("heliconeOutputFormat.md");

    // Read provider-specific prompts
    const openaiContent = this.readPromptFile("heliconeOpenAI.md");
    const azureContent = this.readPromptFile("heliconeAzureOpenAI.md");
    const anthropicContent = this.readPromptFile("heliconeAnthropic.md");
    const geminiContent = this.readPromptFile("heliconeGemini.md");
    const vercelContent = this.readPromptFile("heliconeVercelAI.md");
    const openrouterContent = this.readPromptFile("heliconeOpenRouter.md");

    // Build feature-specific prompts
    let featurePrompts = "";
    if (features.length > 0) {
      // Add selected feature prompts
      features.forEach((feature) => {
        featurePrompts += this.readPromptFile(feature.promptFile) + "\n\n";
      });
    }

    // Combine all the prompt files
    const promptContent = `${introContent}

### Provider-Specific Integration Instructions

${openaiContent}

${azureContent}

${anthropicContent}

${geminiContent}

${vercelContent}

${openrouterContent}

${
  featurePrompts ? "### Selected Feature Instructions\n\n" + featurePrompts : ""
}

${outputFormatContent}`;

    return promptContent;
  }

  /**
   * Gets a list of all available feature prompt files
   * @returns Array of prompt file names
   */
  public getAvailablePromptFiles(): string[] {
    try {
      return fs
        .readdirSync(this.promptsDir)
        .filter((file) => file.startsWith("helicone") && file.endsWith(".md"));
    } catch (error) {
      console.error("Error reading prompts directory:", error);
      return [];
    }
  }
}

export default FeaturePromptService;
