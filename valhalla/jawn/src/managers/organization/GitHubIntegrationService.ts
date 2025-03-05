import { applyPatch, parsePatch } from "diff";
import { GitHubIntegration } from "./OrganizationManager";
import { Octokit } from "octokit";
import * as fs from "fs";
import * as path from "path";
import {
  sanitizeFilePath,
  sanitizeDiffContent,
  isValidDiff,
  extractAddedLines,
  extractFinalContent,
  manuallyExtractCode,
  createSimpleDiff,
  fixInvalidHunks,
  fixUnknownLineErrors,
  fixHunkLineCounts,
} from "../../utils/diffSanitizer";
import { FeaturePromptService, HeliconeFeature } from "./FeaturePromptService";

// Greptile API base URL
const GREPTILE_API_BASE = "https://api.greptile.com/v2";

// Get Greptile API key from environment
const GREPTILE_API_KEY = process.env.GREPTILE_API_KEY || "";

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

  // Main method to process the GitHub integration
  public async processIntegration(
    integrationId: string,
    repositoryUrl: string,
    githubToken: string,
    selectedFeatures?: string[]
  ): Promise<void> {
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
        // For already indexed repositories, construct the status endpoint
        statusEndpoint = `${GREPTILE_API_BASE}/repositories/${repoId}`;
      }

      // Query the repository for Helicone integration
      await this.updateStatus(
        integrationId,
        "Analyzing repository for LLM API calls",
        60
      );
      const queryResults = await this.queryForHeliconeIntegration(
        repoId!,
        githubToken,
        integrationId,
        selectedFeatures
      );

      // Create a pull request with the changes
      await this.updateStatus(integrationId, "Creating pull request", 80);
      const prUrl = await this.createPullRequest(
        repositoryUrl,
        queryResults,
        githubToken,
        integrationId
      );

      // Update the status to completed
      await this.updateStatus(
        integrationId,
        "Integration completed",
        100,
        true,
        undefined,
        prUrl
      );
    } catch (error: any) {
      console.error("Error in integration process:", error);
      await this.updateStatus(
        integrationId,
        "Error",
        100,
        true,
        error.message || "An unexpected error occurred"
      );
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

  // Query the repository for Helicone integration
  private async queryForHeliconeIntegration(
    repoId: string,
    githubToken: string,
    integrationId: string,
    selectedFeatures?: string[]
  ): Promise<any> {
    try {
      await this.addLog(
        integrationId,
        `Querying Greptile for Helicone integration suggestions`
      );

      // Parse the repository ID to get the components
      const decodedRepoId = decodeURIComponent(repoId);
      const [remote, branch, repository] = decodedRepoId.split(":");

      // Convert selectedFeatures to HeliconeFeature objects for the FeaturePromptService
      const features: HeliconeFeature[] =
        selectedFeatures?.map((id) => ({
          id,
          name: this.getFeatureName(id),
          description: "",
          promptFile: `helicone${
            id.charAt(0).toUpperCase() +
            id.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())
          }.md`,
        })) || [];

      await this.addLog(
        integrationId,
        `Generating prompt with ${features.length} selected features`
      );

      // Generate the prompt using FeaturePromptService's provider-specific method
      const promptContent =
        this.featurePromptService.generateProviderSpecificPrompt(features);

      // Make the request to Greptile using the correct API structure
      const response = await fetch(`${GREPTILE_API_BASE}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GREPTILE_API_KEY}`,
          "Content-Type": "application/json",
          "X-Github-Token": githubToken,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: promptContent,
            },
          ],
          repositories: [
            {
              remote,
              repository,
              branch,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to query Greptile: ${response.statusText}`);
      }

      const data = await response.json();

      // Log the first part of the message to help with debugging
      const messagePreview = data.message
        ? `Response preview: ${data.message.substring(0, 500)}...`
        : "No message in response";
      console.log(messagePreview);

      // Log full message for debugging
      console.log("FULL GREPTILE RESPONSE:", data.message);

      await this.addLog(
        integrationId,
        `Greptile response received, length: ${
          data.message?.length || 0
        } characters`
      );

      // Check if the response contains a message
      if (!data.message) {
        await this.addLog(
          integrationId,
          `Warning: Greptile response did not contain a message`
        );
      }

      return data;
    } catch (error: any) {
      console.error("Error querying Greptile:", error);
      await this.addLog(
        integrationId,
        `Error querying Greptile: ${error.message}`
      );
      throw error;
    }
  }

  // Create a pull request with Helicone integration
  private async createPullRequest(
    repositoryUrl: string,
    queryResults: any,
    githubToken: string,
    integrationId: string
  ): Promise<string> {
    try {
      await this.addLog(
        integrationId,
        `Preparing to create pull request for Helicone integration`
      );

      // Parse GitHub repository owner and name from URL
      const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
      }

      const [, owner, repo] = match;

      // GitHub API Base URL
      const GITHUB_API_BASE = "https://api.github.com";

      // Function to make authenticated GitHub API calls
      const githubFetch = async (
        endpoint: string,
        options: RequestInit = {}
      ) => {
        const url = `${GITHUB_API_BASE}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`GitHub API error (${response.status}): ${error}`);
        }

        return await response.json();
      };

      // Create a new branch
      const branchName = `helicone-integration-${Date.now()}`;
      await this.addLog(integrationId, `Creating new branch: ${branchName}`);

      // Get the default branch
      const repository = await githubFetch(`/repos/${owner}/${repo}`);
      const defaultBranch = repository.default_branch;

      // Get the latest commit on the default branch
      const refData = await githubFetch(
        `/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`
      );
      const latestCommitSha = refData.object.sha;

      // Create a new branch from the latest commit
      await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: latestCommitSha,
        }),
      });

      // Process the query results to extract file changes
      const message = queryResults.message;
      await this.addLog(
        integrationId,
        `Processing query results to extract file changes`
      );

      // Extract file changes from the message
      const fileChanges = this.extractFileChanges(message);

      if (fileChanges.length === 0) {
        await this.addLog(
          integrationId,
          `No file changes found in the query results`
        );
        throw new Error("No file changes found in the query results");
      }

      await this.addLog(
        integrationId,
        `Found ${fileChanges.length} file changes to apply`
      );

      // Apply each file change
      for (const fileChange of fileChanges) {
        await this.addLog(
          integrationId,
          `Processing changes for file: ${fileChange.path}`
        );

        // Get the current file content
        let existingContent = "";
        let fileSha = "";
        try {
          const fileData = await githubFetch(
            `/repos/${owner}/${repo}/contents/${fileChange.path}?ref=${branchName}`
          );

          if (fileData.type === "file") {
            existingContent = Buffer.from(
              fileData.content,
              "base64"
            ).toString();
            fileSha = fileData.sha;
            await this.addLog(
              integrationId,
              `Retrieved existing content for ${fileChange.path}`
            );
          } else {
            await this.addLog(
              integrationId,
              `Error: ${fileChange.path} is not a file`
            );
            continue;
          }
        } catch (error: any) {
          if (error.message.includes("404")) {
            await this.addLog(
              integrationId,
              `File ${fileChange.path} does not exist, will create it from diff`
            );
          } else {
            throw error;
          }
        }

        // Apply the diff to the existing content
        let updatedContent = "";

        if (existingContent) {
          // Parse the diff to get the changes
          const diffContent = fileChange.content;
          await this.addLog(
            integrationId,
            `Applying diff to ${fileChange.path} using diff package`
          );

          try {
            // Apply multiple sanitization steps to ensure the diff is valid
            const sanitizedDiff = fixHunkLineCounts(
              fixUnknownLineErrors(
                fixInvalidHunks(sanitizeDiffContent(diffContent))
              )
            );

            // Parse the unified diff
            const patches = parsePatch(sanitizedDiff);

            // Apply the patches to the original content
            updatedContent = existingContent;
            for (const patch of patches) {
              try {
                const patchResult = applyPatch(updatedContent, patch);
                if (patchResult === false) {
                  throw new Error("Patch could not be applied");
                }
                updatedContent = patchResult;
                await this.addLog(
                  integrationId,
                  `Successfully applied patch to ${fileChange.path}`
                );
              } catch (patchError) {
                await this.addLog(
                  integrationId,
                  `Warning: Error applying patch to ${fileChange.path}: ${patchError}. Attempting fuzzy patch.`
                );

                // Try with fuzzy patching (allowing for some context mismatches)
                try {
                  const fuzzyResult = applyPatch(updatedContent, patch, {
                    fuzzFactor: 2,
                  });
                  if (fuzzyResult === false) {
                    throw new Error("Fuzzy patch could not be applied");
                  }
                  updatedContent = fuzzyResult;
                  await this.addLog(
                    integrationId,
                    `Successfully applied fuzzy patch to ${fileChange.path}`
                  );
                } catch (fuzzyError) {
                  await this.addLog(
                    integrationId,
                    `Error: Failed to apply fuzzy patch to ${fileChange.path}: ${fuzzyError}`
                  );
                  throw fuzzyError;
                }
              }
            }
          } catch (error) {
            console.error(`Error applying diff to ${fileChange.path}:`, error);
            await this.addLog(
              integrationId,
              `Error applying diff to ${fileChange.path}: ${error}`
            );
            throw error;
          }
        } else {
          // If the file doesn't exist, extract the added lines from the diff
          const diffContent = fileChange.content;

          try {
            // Apply multiple sanitization steps to ensure the diff is valid
            const sanitizedDiff = fixHunkLineCounts(
              fixUnknownLineErrors(
                fixInvalidHunks(sanitizeDiffContent(diffContent))
              )
            );

            // Parse the unified diff
            const patches = parsePatch(sanitizedDiff);

            // For a new file, we just need to collect all the added lines
            const newLines: string[] = [];

            for (const patch of patches) {
              for (const hunk of patch.hunks) {
                for (const line of hunk.lines) {
                  if (line.startsWith("+") && !line.startsWith("+++")) {
                    newLines.push(line.substring(1));
                  }
                }
              }
            }

            updatedContent = newLines.join("\n");
            await this.addLog(
              integrationId,
              `Created new file content for ${fileChange.path} from diff using diff package`
            );
          } catch (error) {
            console.error(
              `Error creating new file from diff for ${fileChange.path}:`,
              error
            );
            await this.addLog(
              integrationId,
              `Error creating new file from diff for ${fileChange.path}: ${error}`
            );
            throw error;
          }
        }

        // Create or update the file
        if (fileSha) {
          // Update existing file
          await this.addLog(integrationId, `Updating file: ${fileChange.path}`);
          await githubFetch(
            `/repos/${owner}/${repo}/contents/${fileChange.path}`,
            {
              method: "PUT",
              body: JSON.stringify({
                message: `Update ${fileChange.path} with Helicone integration`,
                content: Buffer.from(updatedContent).toString("base64"),
                branch: branchName,
                sha: fileSha,
              }),
            }
          );
        } else {
          // Create new file
          await this.addLog(
            integrationId,
            `Creating new file: ${fileChange.path}`
          );
          await githubFetch(
            `/repos/${owner}/${repo}/contents/${fileChange.path}`,
            {
              method: "PUT",
              body: JSON.stringify({
                message: `Add ${fileChange.path} with Helicone integration`,
                content: Buffer.from(updatedContent).toString("base64"),
                branch: branchName,
              }),
            }
          );
        }
      }

      // Create a pull request
      await this.addLog(integrationId, `Creating pull request`);

      const pullRequest = await githubFetch(`/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        body: JSON.stringify({
          title: "Add Helicone Integration",
          body: `This PR adds Helicone integration to track and monitor your LLM API calls.

## Changes Made
- Added Helicone headers to API calls
- Set up proper authentication for Helicone

## Next Steps
1. Sign up for a Helicone account at https://helicone.ai
2. Create an API key in the Helicone dashboard
3. Add the API key to your environment variables as HELICONE_API_KEY
4. Deploy your application to start tracking API calls

For more information, visit the [Helicone documentation](https://docs.helicone.ai).`,
          head: branchName,
          base: defaultBranch,
        }),
      });

      await this.addLog(
        integrationId,
        `Pull request created: ${pullRequest.html_url}`
      );

      return pullRequest.html_url;
    } catch (error: any) {
      console.error("Error creating pull request:", error);
      await this.addLog(
        integrationId,
        `Error creating pull request: ${error.message}`
      );
      throw error;
    }
  }

  // Extract file changes from the Greptile query results
  private extractFileChanges(
    message: string
  ): Array<{ path: string; content: string }> {
    const fileChanges: Array<{ path: string; content: string }> = [];

    try {
      // Extract diff blocks
      const diffRegex = /```diff\n([\s\S]*?)```/g;
      let diffMatch;

      while ((diffMatch = diffRegex.exec(message)) !== null) {
        const diffContent = diffMatch[1];

        // Parse the diff to get file path and changes
        const filePathRegex = /^--- \/?(.*?)\n\+\+\+ \/?(.*?)$/m;
        const filePathMatch = diffContent.match(filePathRegex);

        if (filePathMatch) {
          // Get the file path and clean it up
          let filePath = filePathMatch[2];

          // Remove 'b/' prefix if present
          filePath = filePath.replace(/^b\//, "");

          // Remove leading slash if present
          filePath = filePath.startsWith("/")
            ? filePath.substring(1)
            : filePath;

          // Store the diff content for this file
          fileChanges.push({
            path: filePath,
            content: diffContent,
          });
        } else {
          console.log(
            `Warning: Found diff block without valid file paths. Skipping.`
          );
        }
      }

      // If no file changes were found, try to extract code blocks with file paths
      if (fileChanges.length === 0) {
        console.log(
          `Warning: No valid diff blocks found in the response. Checking for code blocks.`
        );

        // Try to find file paths followed by code blocks
        const fileBlockRegex =
          /File:\s*`([^`]+)`[\s\S]*?```(?:.*?)\n([\s\S]*?)```/g;
        let fileBlockMatch;

        while ((fileBlockMatch = fileBlockRegex.exec(message)) !== null) {
          const filePath = fileBlockMatch[1].trim();
          const codeContent = fileBlockMatch[2];

          // Create a synthetic diff for the file
          const syntheticDiff = [
            `--- a/${filePath}`,
            `+++ b/${filePath}`,
            `@@ -0,0 +1,${codeContent.split("\n").length} @@`,
            ...codeContent.split("\n").map((line) => `+${line}`),
          ].join("\n");

          fileChanges.push({
            path: filePath,
            content: syntheticDiff,
          });
        }
      }

      return fileChanges;
    } catch (error: any) {
      console.error("Error extracting file changes:", error);
      return fileChanges;
    }
  }

  // Helper method to get feature name from ID
  private getFeatureName(featureId: string): string {
    const nameMap: Record<string, string> = {
      prompts: "Prompts",
      sessions: "Sessions",
      "custom-properties": "Custom Properties",
      "user-metrics": "User Metrics",
      caching: "Caching",
      retries: "Retries",
      "rate-limits": "Custom Rate Limits",
      security: "LLM Security",
    };
    return (
      nameMap[featureId] ||
      featureId.charAt(0).toUpperCase() +
        featureId.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    );
  }
}
