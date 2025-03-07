import * as path from "path";
import { FeaturePromptService } from "./FeaturePromptService";
import { Project, Node, SourceFile } from "ts-morph";
import * as os from "os";
import simpleGit from "simple-git";
import {
  extractSimpleTransformations,
  applySimpleTransformations,
} from "../../utils/simpleTransformationApplier";
import * as ts from "typescript";
import { OpenAI } from "openai";
import * as fs from "fs";
import { exec } from "child_process";
import { v4 as uuidv4 } from "uuid";

// Greptile API base URL
const GREPTILE_API_BASE = "https://api.greptile.com/v2";

// Get Greptile API key from environment
const GREPTILE_API_KEY = process.env.GREPTILE_API_KEY || "";

// Initialize OpenAI client with OpenRouter base URL
const openaiClient = new OpenAI({
  baseURL: "https://openrouter.helicone.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY || ""}`,
  },
});

// Gemini Flash model ID
const GEMINI_FLASH_MODEL = "google/gemini-2.0-flash-lite-001";

export class GitHubIntegrationService {
  private updateStatusCallback: (
    integrationId: string,
    status: string,
    progress: number,
    completed?: boolean,
    error?: string,
    prUrl?: string
  ) => Promise<void>;

  private addLogCallback: (
    integrationId: string,
    message: string
  ) => Promise<void>;

  private featurePromptService: FeaturePromptService;

  constructor(
    updateStatusCallback: (
      integrationId: string,
      status: string,
      progress: number,
      completed?: boolean,
      error?: string,
      prUrl?: string
    ) => Promise<void>,
    addLogCallback: (integrationId: string, message: string) => Promise<void>
  ) {
    this.updateStatusCallback = updateStatusCallback;
    this.addLogCallback = addLogCallback;
    this.featurePromptService = new FeaturePromptService();
  }

  // Helper method to update status
  private async updateStatus(
    integrationId: string,
    status: string,
    progress: number,
    completed = false,
    error?: string,
    prUrl?: string
  ): Promise<void> {
    await this.updateStatusCallback(
      integrationId,
      status,
      progress,
      completed,
      error,
      prUrl
    );
  }

  // Helper method to add log
  private async addLog(integrationId: string, message: string): Promise<void> {
    await this.addLogCallback(integrationId, message);
  }

  public async processIntegration(
    integrationId: string,
    repositoryUrl: string,
    githubToken: string,
    selectedFeatures?: string[]
  ): Promise<string> {
    try {
      // Update status to initializing
      await this.updateStatus(integrationId, "Initializing", 0);
      await this.addLog(integrationId, "Starting GitHub integration");

      // Check if the repository is already indexed by Greptile
      await this.updateStatus(integrationId, "Checking repository status", 10);
      const { indexed, repoId: existingRepoId } =
        await this.checkRepositoryStatus(
          repositoryUrl,
          githubToken,
          integrationId
        );

      // If not indexed, start indexing
      let repoId = existingRepoId;
      let statusEndpoint;

      if (!indexed) {
        await this.updateStatus(
          integrationId,
          "Starting repository indexing",
          20
        );
        const indexingResult = await this.startIndexing(
          repositoryUrl,
          githubToken,
          integrationId
        );

        repoId = indexingResult.repoId;
        statusEndpoint = indexingResult.statusEndpoint;

        // Poll for indexing completion
        await this.updateStatus(integrationId, "Indexing repository", 30);
        let indexingComplete = false;
        let attempts = 0;
        const maxAttempts = 30; // Maximum number of attempts (30 * 10 seconds = 5 minutes)

        while (!indexingComplete && attempts < maxAttempts) {
          // Check status immediately before waiting
          indexingComplete = await this.checkIndexingStatus(
            statusEndpoint,
            githubToken,
            integrationId
          );
          attempts++;

          // Update progress based on attempts
          const progress = Math.min(
            30 + Math.floor((attempts / maxAttempts) * 20),
            50
          );
          await this.updateStatus(
            integrationId,
            "Indexing repository",
            progress
          );

          // Only wait if we need to check again
          if (!indexingComplete && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
          }
        }

        if (!indexingComplete) {
          throw new Error("Repository indexing timed out after 5 minutes");
        }
      } else {
        await this.updateStatus(
          integrationId,
          "Repository already indexed",
          50
        );
      }

      // Parse the repository URL to extract owner and repo name
      const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
      }
      const [, owner, repo] = match;

      // Decode the repository ID
      const decodedRepoId = decodeURIComponent(repoId!);
      const [remote, branch, repository] = decodedRepoId.split(":");

      await this.addLog(integrationId, `Scanning repository for LLM API calls`);
      await this.updateStatus(
        integrationId,
        "Scanning repository for LLM usage",
        60
      );

      const sessionId = uuidv4();
      // Use Gemini Flash to scan the repository for LLM usage
      const fileContents = await this.scanRepositoryForLLMUsage(
        owner,
        repo,
        branch,
        githubToken,
        integrationId,
        sessionId
      );

      await this.addLog(
        integrationId,
        `Found ${fileContents.length} files with LLM usage`
      );
      await this.updateStatus(
        integrationId,
        "Generating Helicone integration",
        80
      );

      // Log file paths to debug
      await this.addLog(
        integrationId,
        `File paths: ${fileContents.map((f) => f.path).join(", ")}`
      );

      // Generate transformations using Claude 3.7 Sonnet with the extracted LLM blocks
      const transformations = await this.generateTransformationsWithClaude(
        fileContents,
        integrationId,
        sessionId
      );

      const parsedResponse = transformations;

      // Create a temporary directory for the repository
      const tempDir = path.join(
        os.tmpdir(),
        `helicone-integration-${Date.now()}`
      );
      fs.mkdirSync(tempDir, { recursive: true });

      await this.addLog(integrationId, `Cloning repository ${owner}/${repo}`);

      // Clone the repository
      const cloneUrl = `https://x-access-token:${githubToken}@github.com/${owner}/${repo}.git`;
      await new Promise<void>((resolve, reject) => {
        exec(`git clone ${cloneUrl} ${tempDir}`, (error) => {
          if (error) {
            reject(new Error(`Failed to clone repository: ${error.message}`));
          } else {
            resolve();
          }
        });
      });

      await this.addLog(
        integrationId,
        `Applying transformations to ${parsedResponse.length} files`
      );

      // Apply the transformations
      const transformationResults = await this.applyFuzzyPatching(
        tempDir,
        parsedResponse
      );

      // Count successful and failed transformations
      const successCount = transformationResults.filter(
        (result) => result.success
      ).length;
      const failureCount = transformationResults.length - successCount;

      await this.addLog(
        integrationId,
        `Applied transformations: ${successCount} successful, ${failureCount} failed`
      );

      // Log the failures if any
      if (failureCount > 0) {
        const failures = transformationResults
          .filter((result) => !result.success)
          .map((result) => `${result.filePath}: ${result.error}`)
          .join("\n");

        await this.addLog(
          integrationId,
          `Transformation failures:\n${failures}`
        );
      }

      // Create a branch name based on the current date
      const branchName = `helicone-integration-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}`;

      // Create and push the branch with changes
      await this.addLog(integrationId, `Creating branch ${branchName}`);

      await new Promise<void>((resolve, reject) => {
        exec(
          `cd ${tempDir} && git checkout -b ${branchName} && git add . && git commit -m "Add Helicone integration" && git push origin ${branchName}`,
          (error) => {
            if (error) {
              reject(new Error(`Failed to push changes: ${error.message}`));
            } else {
              resolve();
            }
          }
        );
      });

      // Create a pull request
      await this.addLog(integrationId, `Creating pull request`);

      const prTitle = "Add Helicone Integration";
      let prBody = "This PR adds Helicone integration to the project.\n\n";

      // Add details about the transformations
      prBody += `## Changes\n\n`;
      prBody += `- ${successCount} files modified successfully\n`;
      if (failureCount > 0) {
        prBody += `- ${failureCount} files could not be modified\n`;
      }

      prBody += "\n## Setup Instructions\n\n";
      prBody += "1. Sign up for a Helicone account at https://helicone.ai\n";
      prBody += "2. Create an API key in the Helicone dashboard\n";
      prBody += "3. Add the following environment variables to your project:\n";
      prBody += "   - `HELICONE_API_KEY`: Your Helicone API key\n";

      // Set up a wrapper for GitHub API calls
      const githubFetch = async (
        endpoint: string,
        options: RequestInit = {}
      ) => {
        const url = `https://api.github.com${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`GitHub API error (${response.status}): ${error}`);
        }

        return response.json();
      };

      // Create the pull request
      const prResponse = await githubFetch(`/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        body: JSON.stringify({
          title: prTitle,
          body: prBody,
          head: branchName,
          base: "main", // Assuming the default branch is main
        }),
      });

      const prUrl = prResponse.html_url;

      await this.addLog(integrationId, `Pull request created: ${prUrl}`);

      // Update status with the PR URL
      await this.updateStatus(
        integrationId,
        "Completed",
        100,
        true,
        undefined,
        prUrl
      );

      // Return a JSON string of the transformations
      return JSON.stringify(transformations);
    } catch (error: any) {
      console.error("Error in integration process:", error);
      await this.updateStatus(
        integrationId,
        "Error",
        100,
        true,
        error.message || "An unexpected error occurred"
      );
      throw error;
    }
  }

  /**
   * Parse the Gemini response into a structured format for transformations
   */
  private parseGeminiResponse(
    geminiResponse: string
  ): { filePath: string; original: string; replacement: string }[] {
    try {
      console.log("Parsing Gemini response");
      const transformations: {
        filePath: string;
        original: string;
        replacement: string;
      }[] = [];

      // First, try to parse the response as JSON
      try {
        // Parse the response as JSON
        const jsonData = JSON.parse(geminiResponse);

        // Handle the new format with needsChanges flag
        if (
          jsonData.file &&
          jsonData.analysis &&
          typeof jsonData.analysis.needsChanges === "boolean"
        ) {
          // Only process changes if needsChanges is true
          if (
            jsonData.analysis.needsChanges &&
            jsonData.changes &&
            Array.isArray(jsonData.changes)
          ) {
            // Process each change for this file
            for (const change of jsonData.changes) {
              if (
                change.original &&
                change.replacement &&
                change.original !== change.replacement
              ) {
                transformations.push({
                  filePath: jsonData.file,
                  original: change.original,
                  replacement: change.replacement,
                });
              }
            }
          }

          console.log(
            `Parsed ${transformations.length} transformations from JSON response (needsChanges: ${jsonData.analysis.needsChanges})`
          );
          return transformations;
        }

        // Handle the old array format for backward compatibility
        if (Array.isArray(jsonData)) {
          // Process JSON array format
          for (const item of jsonData) {
            const filePath = item.file || item.filePath;

            if (filePath && item.changes && Array.isArray(item.changes)) {
              // Process each change for this file
              for (const change of item.changes) {
                if (
                  change.original &&
                  change.replacement &&
                  change.original !== change.replacement
                ) {
                  transformations.push({
                    filePath,
                    original: change.original,
                    replacement: change.replacement,
                  });
                }
              }
            }
          }

          console.log(
            `Parsed ${transformations.length} transformations from JSON array response`
          );
          return transformations;
        }
      } catch (jsonError) {
        console.log("Failed to parse response as JSON:", jsonError);
        // Continue to try the text-based format
      }

      // If JSON parsing failed, try the text-based format with file/ORIGINAL/REPLACEMENT markers
      const fileBlocks = geminiResponse.split("```file:").slice(1);

      for (const block of fileBlocks) {
        const firstLineEnd = block.indexOf("\n");
        const filePath = block.substring(0, firstLineEnd).trim();
        const content = block
          .substring(firstLineEnd + 1, block.lastIndexOf("```"))
          .trim();

        // Split the content into ORIGINAL and REPLACEMENT sections
        const sections = content.split(
          /\n(?:\/\/\s*)?(?:ORIGINAL|REPLACEMENT):\n/
        );
        if (sections.length >= 3) {
          // The first element is empty, the second is ORIGINAL, the third is REPLACEMENT
          const original = sections[1].trim();
          const replacement = sections[2].trim();

          if (original && replacement && original !== replacement) {
            transformations.push({
              filePath,
              original,
              replacement,
            });
          }
        }
      }

      console.log(
        `Parsed ${transformations.length} transformations from text-based response`
      );
      return transformations;
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      return [];
    }
  }

  // Check if the repository is already indexed by Greptile
  private async checkRepositoryStatus(
    repositoryUrl: string,
    githubToken: string,
    integrationId: string
  ): Promise<{ indexed: boolean; repoId?: string }> {
    try {
      // Parse GitHub repository owner and name from URL
      const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
      }

      const [, owner, repo] = match;
      await this.addLog(
        integrationId,
        `Checking if repository ${owner}/${repo} is already indexed`
      );

      // Construct the repository ID in the format expected by Greptile
      const repositoryIdentifier = encodeURIComponent(
        `github:main:${owner}/${repo}`
      );

      // Check if the repository exists in Greptile
      const response = await fetch(
        `${GREPTILE_API_BASE}/repositories/${repositoryIdentifier}`,
        {
          headers: {
            Authorization: `Bearer ${GREPTILE_API_KEY}`,
          },
        }
      );

      // If we get a 200 response, the repository is already indexed
      if (response.ok) {
        await this.addLog(
          integrationId,
          `Repository ${owner}/${repo} is already indexed`
        );
        return { indexed: true, repoId: repositoryIdentifier };
      }

      return { indexed: false };
    } catch (error: any) {
      // If we get a 404, the repository is not indexed yet
      if (error.status === 404) {
        await this.addLog(
          integrationId,
          `Repository is not indexed yet, will start indexing`
        );
        return { indexed: false };
      }

      // For other errors, log and rethrow
      console.error("Error checking repository status:", error);
      await this.addLog(
        integrationId,
        `Error checking repository status: ${error.message}`
      );
      throw error;
    }
  }

  // Start indexing the repository with Greptile
  private async startIndexing(
    repositoryUrl: string,
    githubToken: string,
    integrationId: string
  ): Promise<{ repoId: string; statusEndpoint: string }> {
    try {
      // Parse GitHub repository owner and name from URL
      const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
      }

      const [, owner, repo] = match;
      await this.addLog(
        integrationId,
        `Starting indexing for repository ${owner}/${repo}`
      );

      // Start indexing the repository with Greptile
      const response = await fetch(`${GREPTILE_API_BASE}/repositories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GREPTILE_API_KEY}`,
          "Content-Type": "application/json",
          "X-Github-Token": githubToken,
        },
        body: JSON.stringify({
          remote: "github",
          repository: `${owner}/${repo}`,
          branch: "main",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start indexing: ${response.statusText}`);
      }

      const data = await response.json();

      // The repository ID is in the format remote:branch:owner/repo
      const repositoryIdentifier = encodeURIComponent(
        `github:main:${owner}/${repo}`
      );

      // Check if the repository is already being processed
      if (
        data.message === "Repository is already being processed" &&
        data.statusEndpoint
      ) {
        await this.addLog(
          integrationId,
          `Repository is already being processed. Using status endpoint: ${data.statusEndpoint}`
        );
        return {
          repoId: repositoryIdentifier,
          statusEndpoint: data.statusEndpoint,
        };
      }

      // For new indexing jobs
      await this.addLog(
        integrationId,
        `Indexing started for repository with ID: ${repositoryIdentifier}`
      );
      const statusEndpoint = `${GREPTILE_API_BASE}/repositories/${repositoryIdentifier}`;

      return {
        repoId: repositoryIdentifier,
        statusEndpoint,
      };
    } catch (error: any) {
      console.error("Error starting indexing:", error);
      await this.addLog(
        integrationId,
        `Error starting indexing: ${error.message}`
      );
      throw error;
    }
  }

  // Check indexing status directly from the status endpoint
  private async checkIndexingStatus(
    statusEndpoint: string,
    githubToken: string,
    integrationId: string
  ): Promise<boolean> {
    try {
      await this.addLog(
        integrationId,
        `Checking indexing status using endpoint: ${statusEndpoint}`
      );

      const response = await fetch(statusEndpoint, {
        headers: {
          Authorization: `Bearer ${GREPTILE_API_KEY}`,
          "X-Github-Token": githubToken,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to check indexing status: ${response.statusText}`
        );
      }

      const data = await response.json();
      const status = data.status;
      await this.addLog(integrationId, `Indexing status: ${status}`);

      // Check if indexing is complete (COMPLETED or READY are both valid success states)
      return status === "COMPLETED" || status === "READY" || status === "ready";
    } catch (error: any) {
      // Log the error and rethrow
      console.error("Error checking indexing status:", error);
      await this.addLog(
        integrationId,
        `Error checking indexing status: ${error.message || String(error)}`
      );
      throw error;
    }
  }

  /**
   * Creates a unique identifier for a file path that's more specific than just the filename
   * but still concise enough for use in session paths
   */
  private getUniquePathIdentifier(filePath: string): string {
    const parts = filePath.split("/");

    // If the path has only one part (just filename), return it
    if (parts.length === 1) {
      return parts[0];
    }

    // If the path has two parts, return both joined with a dash
    if (parts.length === 2) {
      return parts.join("-");
    }

    // For longer paths, take the last two directories and the filename
    // e.g., "app/api/debate/route.ts" becomes "debate-route.ts"
    return parts.slice(-3).join("-");
  }

  getFeatureName = (featureId: string): string => {
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

  /**
   * Apply fuzzy patching to files based on the parsed transformations
   */
  private async applyFuzzyPatching(
    repoPath: string,
    transformations: {
      filePath: string;
      original: string;
      replacement: string;
    }[]
  ): Promise<{ filePath: string; success: boolean; error?: string }[]> {
    const results: { filePath: string; success: boolean; error?: string }[] =
      [];

    for (const transformation of transformations) {
      try {
        const fullFilePath = path.join(repoPath, transformation.filePath);

        // Check if file exists
        if (!fs.existsSync(fullFilePath)) {
          results.push({
            filePath: transformation.filePath,
            success: false,
            error: `File not found: ${fullFilePath}`,
          });
          continue;
        }

        // Read the file content
        const fileContent = fs.readFileSync(fullFilePath, "utf8");

        // Apply the transformation using fuzzy matching
        if (fileContent.includes(transformation.original)) {
          // Direct replacement if exact match found
          const newContent = fileContent.replace(
            transformation.original,
            transformation.replacement
          );

          // Write the modified content back to the file
          fs.writeFileSync(fullFilePath, newContent);

          results.push({
            filePath: transformation.filePath,
            success: true,
          });
        } else {
          console.log(
            `Exact match not found for ${transformation.filePath}, trying fuzzy match`
          );

          // Try multiple matching strategies
          let matched = false;
          let newContent = fileContent;

          // Strategy 1: Normalized whitespace matching
          if (!matched) {
            const normalizedFileContent = fileContent
              .replace(/\s+/g, " ")
              .replace(/\r\n/g, "\n");

            const normalizedOriginal = transformation.original
              .replace(/\s+/g, " ")
              .replace(/\r\n/g, "\n");

            if (normalizedFileContent.includes(normalizedOriginal)) {
              // Create a regex that's more flexible with whitespace
              const escapedOriginal = transformation.original
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                .replace(/\s+/g, "\\s+")
                .replace(/\n/g, "\\n?");

              const fuzzyRegex = new RegExp(escapedOriginal, "g");
              newContent = fileContent.replace(
                fuzzyRegex,
                transformation.replacement
              );
              matched = true;
            }
          }

          // Strategy 2: Function call pattern matching
          // This helps match function calls like client.chat.completions.create() even if parameters differ
          if (!matched) {
            // Extract function call pattern from original
            const functionCallMatch =
              transformation.original.match(/(\w+(?:\.\w+)*\s*\()/);

            if (functionCallMatch && functionCallMatch[1]) {
              const functionCallPattern = functionCallMatch[1];
              // Find all occurrences of this function call in the file
              const functionCallRegex = new RegExp(
                `${functionCallPattern.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&"
                )}[\\s\\S]*?\\)`,
                "g"
              );

              const matches = fileContent.match(functionCallRegex);

              if (matches && matches.length > 0) {
                // Find the best match based on similarity
                let bestMatch = null;
                let highestScore = 0;

                for (const match of matches) {
                  // Simple similarity score - count matching characters
                  let score = 0;
                  const minLength = Math.min(
                    match.length,
                    transformation.original.length
                  );
                  for (let i = 0; i < minLength; i++) {
                    if (match[i] === transformation.original[i]) {
                      score++;
                    }
                  }

                  if (score > highestScore) {
                    highestScore = score;
                    bestMatch = match;
                  }
                }

                if (
                  bestMatch &&
                  highestScore > transformation.original.length * 0.7
                ) {
                  newContent = fileContent.replace(
                    bestMatch,
                    transformation.replacement
                  );
                  matched = true;
                }
              }
            }
          }

          // Strategy 3: Key parameter matching
          // This helps match code blocks with specific parameters like model names
          if (!matched) {
            // Extract key parameters from original (like model names, temperature values)
            const keyParams = [
              ...transformation.original.matchAll(
                /model\s*:\s*["']([^"']+)["']/g
              ),
              ...transformation.original.matchAll(
                /temperature\s*:\s*([\d.]+)/g
              ),
              ...transformation.original.matchAll(/apiKey\s*:\s*([^,\n\r}]+)/g),
            ].map((match) => match[1]);

            if (keyParams.length > 0) {
              // Find code blocks containing these key parameters
              const lines = fileContent.split("\n");
              let potentialMatches = [];

              for (let i = 0; i < lines.length; i++) {
                for (const param of keyParams) {
                  if (lines[i].includes(param)) {
                    // Extract a block of code around this line
                    const startLine = Math.max(0, i - 10);
                    const endLine = Math.min(lines.length, i + 10);
                    potentialMatches.push(
                      lines.slice(startLine, endLine).join("\n")
                    );
                    break;
                  }
                }
              }

              if (potentialMatches.length > 0) {
                // Find the best match based on parameter overlap
                let bestMatch = null;
                let highestScore = 0;

                for (const match of potentialMatches) {
                  let score = 0;
                  for (const param of keyParams) {
                    if (match.includes(param)) {
                      score++;
                    }
                  }

                  if (score > highestScore) {
                    highestScore = score;
                    bestMatch = match;
                  }
                }

                if (
                  bestMatch &&
                  highestScore >= Math.ceil(keyParams.length * 0.5)
                ) {
                  // We found a good match, now we need to replace just the relevant part
                  newContent = fileContent.replace(
                    bestMatch,
                    bestMatch.replace(
                      // Find the function call or client initialization in the matched block
                      /(\w+(?:\.\w+)*\s*\([^)]*\)|\w+\s*=\s*new\s+\w+\([^)]*\))/g,
                      (found) => {
                        // Only replace if it looks similar to our original
                        const normalizedFound = found.replace(/\s+/g, " ");
                        const normalizedOriginal =
                          transformation.original.replace(/\s+/g, " ");

                        if (
                          normalizedFound.includes(
                            normalizedOriginal.substring(0, 20)
                          ) ||
                          normalizedOriginal.includes(
                            normalizedFound.substring(0, 20)
                          )
                        ) {
                          return transformation.replacement;
                        }
                        return found;
                      }
                    )
                  );
                  matched = true;
                }
              }
            }
          }

          if (matched) {
            // Write the modified content back to the file
            fs.writeFileSync(fullFilePath, newContent);

            results.push({
              filePath: transformation.filePath,
              success: true,
            });
          } else {
            results.push({
              filePath: transformation.filePath,
              success: false,
              error:
                "Could not find matching code segment, even with enhanced fuzzy matching",
            });
          }
        }
      } catch (error) {
        results.push({
          filePath: transformation.filePath,
          success: false,
          error: `Error applying transformation: ${error}`,
        });
      }
    }

    return results;
  }

  /**
   * Scan repository files using Gemini Flash to identify LLM usage
   */
  private async scanRepositoryForLLMUsage(
    owner: string,
    repo: string,
    branch: string,
    githubToken: string,
    integrationId: string,
    sessionId: string
  ): Promise<
    {
      path: string;
      content: string;
      llmBlocks?: string[];
      description?: string;
    }[]
  > {
    try {
      await this.addLog(
        integrationId,
        `Scanning repository for LLM usage with Gemini Flash`
      );

      // First, get a list of all files in the repository
      const allFiles = await this.listRepositoryFiles(
        owner,
        repo,
        branch,
        githubToken
      );

      // Filter to only include likely code files
      const codeFileExtensions = [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".py",
        ".rb",
        ".go",
        ".java",
        ".php",
        ".cs",
      ];
      const codeFiles = allFiles.filter((file) =>
        codeFileExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      );

      await this.addLog(
        integrationId,
        `Found ${codeFiles.length} code files to scan`
      );

      // Process files in batches to avoid overwhelming the API
      const batchSize = 10; // Process 10 files in parallel
      const fileContents: {
        path: string;
        content: string;
        llmBlocks?: string[];
        description?: string;
      }[] = [];

      // Process files in batches
      for (let i = 0; i < codeFiles.length; i += batchSize) {
        const batch = codeFiles.slice(i, i + batchSize);
        await this.addLog(
          integrationId,
          `Scanning batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            codeFiles.length / batchSize
          )}`
        );

        // Process each file in the batch in parallel
        const batchPromises = batch.map(async (filePath) => {
          try {
            // Fetch file content from GitHub
            const fileData = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
              {
                headers: {
                  Authorization: `Bearer ${githubToken}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );

            // Parse the response as JSON
            const fileDataJson = await fileData.json();

            // GitHub API returns content as base64 encoded
            const content = Buffer.from(
              fileDataJson.content,
              "base64"
            ).toString("utf-8");

            // Prepare the prompt for Gemini to extract LLM blocks
            const geminiPrompt = `# LLM Usage Block Extraction

## Context
You are analyzing code for Helicone's GitHub Integration feature. Helicone is a monitoring platform for LLM API calls.
This is step 1 of a 3-step process:
1. You identify LLM usage in code files (current step)
2. Claude will generate transformations to add Helicone integration
3. The transformations will be applied to create a pull request

Your analysis is critical - if you miss LLM usage or extract incorrect blocks, the integration will fail.

## Task
Analyze this file and extract code blocks that contain LLM API calls or client initializations.

## What to Look For
1. CLIENT INITIALIZATION - Code that creates clients for:
   - OpenAI: \`new OpenAI()\`, \`new Configuration()\`
   - Anthropic: \`new Anthropic()\`
   - Gemini/Vertex: \`VertexAI\`, \`GenerativeModel\`
   - OpenRouter: \`createOpenRouter()\`
   - Any other LLM provider

2. API CALLS - Function calls that request LLM responses:
   - OpenAI: \`openai.chat.completions.create()\`, \`openai.completions.create()\`
   - Anthropic: \`anthropic.messages.create()\`, \`anthropic.completions.create()\`
   - Gemini/Vertex: \`model.generateContent()\`
   - Generic: \`generateText()\`, \`generate()\`, \`complete()\`
   - Any function with model names like "gpt", "claude", "gemini", "llama"

3. CONFIGURATION - Code that sets up LLM parameters:
   - API keys: \`OPENAI_API_KEY\`, \`ANTHROPIC_API_KEY\`
   - Model names: \`gpt-4\`, \`claude-3\`, \`gemini-pro\`
   - Parameters: \`temperature\`, \`max_tokens\`, \`top_p\`

## Response Format
Provide a JSON object with this structure:
{
  "file": "${filePath}",
  "analysis": {
    "containsLLMUsage": true/false,
    "description": "Detailed description of all LLM usage in this file"
  },
  "llmBlocks": [
    // Only include if containsLLMUsage is true
    "complete code block with LLM client initialization or API call, including surrounding context",
    "another code block if there are multiple instances"
  ]
}

## Important Guidelines
1. EXTRACT COMPLETE BLOCKS: Include entire function calls or client initializations
2. INCLUDE CONTEXT: Capture 10-15 lines before/after to provide sufficient context
3. CAPTURE IMPORTS: Include relevant import statements for LLM libraries
4. BE THOROUGH: Look for all instances of LLM usage, not just obvious ones
5. PRESERVE FORMATTING: Maintain indentation and code structure exactly as in the original
6. INCLUDE FUNCTION BOUNDARIES: If LLM usage is inside a function, include the entire function

## File to Analyze
- ${filePath}

## File Content
\`\`\`
${content}
\`\`\`

Your response must be a valid JSON object that can be parsed directly.`;

            // Call Gemini Flash to analyze the file
            const completion = await openaiClient.chat.completions.create(
              {
                model: "anthropic/claude-3.5-sonnet",
                messages: [
                  {
                    role: "user",
                    content: geminiPrompt,
                  },
                ],
                temperature: 0.2,
                response_format: { type: "json_object" },
              },
              {
                headers: {
                  "HTTP-Referer": "https://helicone.ai",
                  "X-Title": "Helicone GitHub Integration - LLM Detection",
                  "Helicone-Session-Id": sessionId,
                  "Helicone-Session-Path": `/scan/${this.getUniquePathIdentifier(
                    filePath
                  )}`,
                  "Helicone-Session-Name": "GitHub Integration",
                },
              }
            );

            const geminiResponse =
              completion.choices[0].message.content || "{}";

            try {
              // Parse the response
              const jsonData = JSON.parse(geminiResponse);

              if (
                jsonData.file &&
                jsonData.analysis &&
                typeof jsonData.analysis.containsLLMUsage === "boolean"
              ) {
                if (
                  jsonData.analysis.containsLLMUsage &&
                  jsonData.llmBlocks &&
                  Array.isArray(jsonData.llmBlocks)
                ) {
                  return {
                    path: filePath,
                    content,
                    llmBlocks: jsonData.llmBlocks,
                    description: jsonData.analysis.description,
                  };
                }
              }
            } catch (error) {
              await this.addLog(
                integrationId,
                `Error parsing Gemini response for ${filePath}: ${error}`
              );
            }

            // Return the file with empty llmBlocks if no LLM usage was found or there was an error
            return {
              path: filePath,
              content,
              llmBlocks: [],
              description: "No LLM usage detected",
            };
          } catch (error: any) {
            await this.addLog(
              integrationId,
              `Error retrieving file ${filePath}: ${error.message}`
            );
            // Return the file with empty llmBlocks if there was an error
            return {
              path: filePath,
              content: "",
              llmBlocks: [],
              description: `Error retrieving file: ${error.message}`,
            };
          }
        });

        // Wait for all files in the batch to be processed
        const batchResults = await Promise.all(batchPromises);

        // Add all files to fileContents
        for (const result of batchResults) {
          if (result) {
            fileContents.push(result);
          }
        }

        // Count files with LLM blocks
        const filesWithLLMBlocks = batchResults.filter(
          (result) => result && result.llmBlocks && result.llmBlocks.length > 0
        );

        await this.addLog(
          integrationId,
          `Found ${filesWithLLMBlocks.length} files with LLM usage in this batch`
        );
      }

      await this.addLog(
        integrationId,
        `Completed scan, found ${
          fileContents.filter((f) => f.llmBlocks && f.llmBlocks.length > 0)
            .length
        } files with LLM usage`
      );

      return fileContents;
    } catch (error: any) {
      console.error("Error scanning repository for LLM usage:", error);
      await this.addLog(
        integrationId,
        `Error scanning repository: ${error.message}`
      );
      return [];
    }
  }

  /**
   * List all files in a repository
   */
  private async listRepositoryFiles(
    owner: string,
    repo: string,
    branch: string,
    githubToken: string
  ): Promise<string[]> {
    const files: string[] = [];

    // Recursive function to list files in a directory
    const listFiles = async (path = "") => {
      const contents = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const data = await contents.json();

      for (const item of data) {
        if (item.type === "file") {
          files.push(item.path);
        } else if (item.type === "dir") {
          await listFiles(item.path);
        }
      }
    };

    await listFiles();
    return files;
  }

  /**
   * Generate transformations for each file using Claude 3.7 Sonnet
   */
  private async generateTransformationsWithClaude(
    filesWithLLMBlocks: {
      path: string;
      content: string;
      llmBlocks?: string[];
      description?: string;
    }[],
    integrationId: string,
    sessionId: string
  ): Promise<{ filePath: string; original: string; replacement: string }[]> {
    const allTransformations: {
      filePath: string;
      original: string;
      replacement: string;
    }[] = [];

    // Filter out files without LLM blocks
    const filesToProcess = filesWithLLMBlocks.filter(
      (file) => file.llmBlocks && file.llmBlocks.length > 0
    );

    // Process files in parallel batches
    const batchSize = 5; // Process 5 files in parallel

    for (let i = 0; i < filesToProcess.length; i += batchSize) {
      const batch = filesToProcess.slice(i, i + batchSize);
      await this.addLog(
        integrationId,
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          filesToProcess.length / batchSize
        )} (${batch.length} files)`
      );

      // Create an array of promises for each file in the batch
      const batchPromises = batch.map(async (file) => {
        await this.addLog(
          integrationId,
          `Generating transformations for ${file.path}`
        );

        // Prepare the LLM blocks context
        const llmBlocksContext =
          file.llmBlocks
            ?.map(
              (block, index) =>
                `## LLM Block ${index + 1}\n\`\`\`\n${block}\n\`\`\`\n\n`
            )
            .join("") || "";

        // Prepare the prompt for Claude
        const claudePrompt = `
        You're a senior software engineer who is an expert at integrating Helicone with LLM APIs.

        ## Context
        This is step 2 of a 3-step process:
        1. Gemini will identify LLM usage in code files (previous step)
        2. Claude will generate the necessary transformations to add Helicone integration (current step)
        3. The transformations will be applied to create a pull request (next step)

        Your integration is critical - if you unnecessary integrate Helicone or incorrectly integrate Helicone, it will break the integration.

        ## Task
        Analyze the LLM usage blocks and generate the necessary transformations to add Helicone integration.

        ## What to Look For
        1. CLIENT INITIALIZATION - Code that creates clients for:
          - OpenAI: \`new OpenAI()\`, \`new Configuration()\`
          - Anthropic: \`new Anthropic()\`
          - Gemini/Vertex: \`VertexAI\`, \`GenerativeModel\`
          - OpenRouter: \`createOpenRouter()\`
          - Any other LLM provider

        2. API CALLS - Function calls that request LLM responses:
          - OpenAI: \`openai.chat.completions.create()\`, \`openai.completions.create()\`
          - Anthropic: \`anthropic.messages.create()\`, \`anthropic.completions.create()\`
          - Gemini/Vertex: \`model.generateContent()\`
          - Generic: \`generateText()\`, \`generate()\`, \`complete()\`
          - Any function with model names like "gpt", "claude", "gemini", "llama"

        3. CONFIGURATION - Code that sets up LLM parameters:
          - API keys: \`OPENAI_API_KEY\`, \`ANTHROPIC_API_KEY\`
          - Model names: \`gpt-4\`, \`claude-3\`, \`gemini-pro\`
          - Parameters: \`temperature\`, \`max_tokens\`, \`top_p\`

        ## Helicone Integration
        1. Changing API base URLs to Helicone proxy endpoints
        2. Adding Helicone authentication headers
        3. Ensuring environment variables are properly set up

        ## Integration Examples by Provider

        ### OpenAI
        \`\`\`javascript
        // BEFORE
        import { OpenAI } from "openai";
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // AFTER
        import { OpenAI } from "openai";
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: "https://oai.helicone.ai",
          defaultHeaders: {
            "Helicone-Auth": "Bearer " + process.env.HELICONE_API_KEY
          }
        });
        \`\`\`

        ### OpenRouter (for Gemini)
        \`\`\`javascript
        // BEFORE
        export const openrouter = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY || "",
        });

        // AFTER
        export const openrouter = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY || "",
          baseURL: "https://openrouter.helicone.ai/api/v1",
          defaultHeaders: {
            "Helicone-Auth": "Bearer " + process.env.HELICONE_API_KEY
          }
        });
        \`\`\`

        ## File Information which may need Helicone integration
        <file_path>
        ${file.path}
        </file_path>

        <file_description>
        ${file.description || "No description provided"}
        </file_description>

        ## LLM Usage Blocks that may need Helicone integration
        <llm_usage_blocks>
        ${llmBlocksContext}
        </llm_usage_blocks>

        ## Response Format
        Provide a JSON array of objects with this structure:
        [
          {
            "original": "code block that needs to be changed",
            "replacement": "new code with Helicone integration",
            "reasoning": "detailed step by step reasoning for the changes"
          }
        ]

        ## Important Guidelines
        1. ONLY INCLUDE BLOCKS THAT NEED CHANGES: If a block doesn't need modification, don't include it
        2. EXACT MATCHING: Your response will be processed by a fuzzy matching algorithm that tries to find and replace code
        3. CONTEXT: Include enough surrounding code to uniquely identify where changes should be made
        4. COMPLETE BLOCKS: Never truncate code snippets - include complete statements with balanced brackets/parentheses
        5. FUNCTION CALLS: For function calls, include the entire call from function name to closing parenthesis
        6. TEMPLATE LITERALS: For code with backticks, include the entire string with all backticks properly escaped
        7. MEANINGFUL CHANGES: Only include changes where the original and replacement are different
        8. HELICONE INTEGRATION: Include proper headers and base URLs for each LLM provider
        9. AUTHENTICATION: Ensure proper environment variable usage (HELICONE_API_KEY)

        Your response must be a valid JSON array that can be parsed directly.`;

        try {
          // Call Claude 3.7 Sonnet through OpenRouter
          const completion = await openaiClient.chat.completions.create(
            {
              model: "anthropic/claude-3.7-sonnet",
              messages: [
                {
                  role: "user",
                  content: claudePrompt,
                },
              ],
              temperature: 0.2,
              response_format: { type: "json_object" },
            },
            {
              headers: {
                "HTTP-Referer": "https://helicone.ai",
                "X-Title": "Helicone GitHub Integration",
                "Helicone-Session-Id": sessionId,
                "Helicone-Session-Path": `/transform/${this.getUniquePathIdentifier(
                  file.path
                )}`,
                "Helicone-Session-Name": "GitHub Integration",
              },
            }
          );

          const claudeResponse = completion.choices[0].message.content || "[]";
          await this.addLog(
            integrationId,
            `Received response from Claude for ${file.path}`
          );

          try {
            // Parse the response
            const changes = JSON.parse(claudeResponse);

            if (Array.isArray(changes)) {
              const fileTransformations = changes
                .filter(
                  (change) =>
                    change.original &&
                    change.replacement &&
                    change.original !== change.replacement
                )
                .map((change) => ({
                  filePath: file.path,
                  original: change.original,
                  replacement: change.replacement,
                }));

              await this.addLog(
                integrationId,
                `Parsed ${fileTransformations.length} transformations for ${file.path}`
              );

              return fileTransformations;
            }
          } catch (error) {
            await this.addLog(
              integrationId,
              `Error parsing Claude response for ${file.path}: ${error}`
            );
          }

          return [];
        } catch (error) {
          await this.addLog(
            integrationId,
            `Error calling Claude for ${file.path}: ${error}`
          );
          return [];
        }
      });

      // Wait for all files in the batch to be processed
      const batchResults = await Promise.all(batchPromises);

      // Combine all transformations from this batch
      for (const transformations of batchResults) {
        allTransformations.push(...transformations);
      }
    }

    await this.addLog(
      integrationId,
      `Generated ${allTransformations.length} total transformations`
    );

    return allTransformations;
  }
}
