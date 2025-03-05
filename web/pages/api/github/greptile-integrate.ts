import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Octokit } from "@octokit/rest";
import { v4 as uuidv4 } from "uuid";
import { applyPatch, parsePatch } from "diff";

// Store integration status in memory (in production, use a database)
interface IntegrationStatus {
  status: string;
  progress: number;
  completed: boolean;
  error?: string;
  prUrl?: string;
  recentLogs: string[];
}

export const integrationStatus: Record<string, IntegrationStatus> = {};

// Greptile API base URL
const GREPTILE_API_BASE = "https://api.greptile.com/v2";

// Helper function to add a log message to the integration status
const addLog = (integrationId: string, message: string) => {
  if (!integrationStatus[integrationId]) {
    integrationStatus[integrationId] = {
      status: "Initializing",
      progress: 0,
      completed: false,
      recentLogs: [],
    };
  }

  console.log(`[${integrationId}] ${message}`);

  // Keep only the most recent 20 logs
  const logs = [...integrationStatus[integrationId].recentLogs, message];
  if (logs.length > 20) {
    logs.shift();
  }

  integrationStatus[integrationId].recentLogs = logs;
};

// Helper function to update the integration status
const updateStatus = (
  integrationId: string,
  status: string,
  progress: number,
  completed = false,
  error?: string,
  prUrl?: string
) => {
  // Never update if already completed
  if (integrationStatus[integrationId]?.completed) {
    console.log(`BLOCKED: ${integrationId} already completed`);
    return;
  }

  // Update status
  integrationStatus[integrationId] = {
    status,
    progress,
    completed,
    error,
    prUrl,
    recentLogs: integrationStatus[integrationId]?.recentLogs || [],
  };

  // Log update
  addLog(integrationId, `Status: ${status} (${progress}%)`);

  // Log completion
  if (completed) {
    console.log(`COMPLETED: ${integrationId} - ${status}`);
    if (error) {
      addLog(integrationId, `Failed: ${error}`);
    } else if (prUrl) {
      addLog(integrationId, `Success: PR at ${prUrl}`);
    }
  }
};

// Function to check if a repository is indexed by Greptile
async function checkRepositoryStatus(
  repositoryUrl: string,
  greptileApiKey: string,
  integrationId: string,
  githubToken: string
): Promise<{ indexed: boolean; repoId?: string }> {
  try {
    addLog(
      integrationId,
      `Checking if repository ${repositoryUrl} is indexed by Greptile`
    );

    // Parse GitHub repository owner and name from URL
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
    }

    const [, owner, repo] = match;
    const repositoryIdentifier = encodeURIComponent(
      `github:main:${owner}/${repo}`
    );

    // Check if the repository exists
    const response = await axios.get(
      `${GREPTILE_API_BASE}/repositories/${repositoryIdentifier}`,
      {
        headers: {
          Authorization: `Bearer ${greptileApiKey}`,
          "X-Github-Token": githubToken,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to get repository info: ${response.statusText}`);
    }

    // If we get a response with a status, the repository exists
    const status = response.data.status;
    const isIndexed = status === "COMPLETED" || status === "READY";

    if (isIndexed) {
      addLog(
        integrationId,
        `Repository found in Greptile with status: ${status}`
      );
      return { indexed: true, repoId: repositoryIdentifier };
    } else {
      addLog(
        integrationId,
        `Repository found in Greptile but not fully indexed (status: ${status})`
      );
      return { indexed: false };
    }
  } catch (error: any) {
    // If we get a 404, the repository doesn't exist
    if (error.response && error.response.status === 404) {
      addLog(
        integrationId,
        `Repository not found in Greptile, will need to be indexed`
      );
      return { indexed: false };
    }

    console.error("Error checking repository status:", error);
    addLog(integrationId, `Error checking repository status: ${error}`);
    throw error;
  }
}

// Function to start indexing a repository with Greptile
async function startIndexing(
  repositoryUrl: string,
  greptileApiKey: string,
  integrationId: string,
  githubToken: string
): Promise<{ repoId: string; statusEndpoint: string }> {
  try {
    addLog(integrationId, `Starting indexing for repository: ${repositoryUrl}`);

    // Parse GitHub repository owner and name from URL
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
    }

    const [, owner, repo] = match;

    const response = await axios.post(
      `${GREPTILE_API_BASE}/repositories`,
      {
        remote: "github",
        repository: `${owner}/${repo}`,
        branch: "main", // Default to main branch
      },
      {
        headers: {
          Authorization: `Bearer ${greptileApiKey}`,
          "X-Github-Token": githubToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Failed to start indexing: ${response.statusText}`);
    }

    // The repository ID is in the format remote:branch:owner/repo
    const repositoryIdentifier = encodeURIComponent(
      `github:main:${owner}/${repo}`
    );

    // Check if the repository is already being processed
    if (
      response.data.message === "Repository is already being processed" &&
      response.data.statusEndpoint
    ) {
      addLog(
        integrationId,
        `Repository is already being processed. Using status endpoint: ${response.data.statusEndpoint}`
      );
      return {
        repoId: repositoryIdentifier,
        statusEndpoint: response.data.statusEndpoint,
      };
    }

    // For new indexing jobs
    addLog(
      integrationId,
      `Indexing started for repository with ID: ${repositoryIdentifier}`
    );
    const statusEndpoint = `${GREPTILE_API_BASE}/repositories/${repositoryIdentifier}`;

    return {
      repoId: repositoryIdentifier,
      statusEndpoint,
    };
  } catch (error) {
    console.error("Error starting indexing:", error);
    addLog(integrationId, `Error starting indexing: ${error}`);
    throw error;
  }
}

// Function to check indexing status directly from the status endpoint
async function checkIndexingStatus(
  statusEndpoint: string,
  greptileApiKey: string,
  integrationId: string,
  githubToken: string
): Promise<boolean> {
  try {
    addLog(
      integrationId,
      `Checking indexing status using endpoint: ${statusEndpoint}`
    );

    const response = await axios.get(statusEndpoint, {
      headers: {
        Authorization: `Bearer ${greptileApiKey}`,
        "X-Github-Token": githubToken,
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to check indexing status: ${response.statusText}`
      );
    }

    const status = response.data.status;
    addLog(integrationId, `Indexing status: ${status}`);

    return status === "COMPLETED" || status === "READY";
  } catch (error) {
    console.error("Error checking indexing status:", error);
    addLog(integrationId, `Error checking indexing status: ${error}`);
    throw error;
  }
}

// Function to query the repository for Helicone integration
async function queryForHeliconeIntegration(
  repoId: string,
  greptileApiKey: string,
  integrationId: string,
  githubToken: string
): Promise<any> {
  try {
    addLog(
      integrationId,
      `Querying repository for LLM API calls to integrate with Helicone using the proxy approach`
    );

    // Parse the repository ID to get the components
    const decodedRepoId = decodeURIComponent(repoId);
    const [remote, branch, repository] = decodedRepoId.split(":");

    const query = `
      Find all LLM API calls in the codebase that could be integrated with Helicone using the proxy approach.
      This includes:
      1. OpenAI API calls (openai, @azure/openai, etc.)
      2. Anthropic API calls (@anthropic-ai/sdk, anthropic, etc.)
      3. Cohere API calls (cohere-ai, etc.)
      4. Any other LLM API providers (AI21, Claude, Mistral, Gemini, etc.)
      
      For each API call, determine:
      - The file path
      - The API provider (OpenAI, Anthropic, etc.)
      - The specific changes needed to integrate Helicone via proxy
      
      For OpenAI integration:
      - Change the base URL from "https://api.openai.com/v1" to "https://oai.helicone.ai/v1"
      - Add the Helicone-Auth header: { "Helicone-Auth": "Bearer HELICONE_API_KEY" }
      
      For Anthropic integration:
      - Change the base URL from "https://api.anthropic.com" to "https://anthropic.helicone.ai"
      - Add the Helicone-Auth header: { "Helicone-Auth": "Bearer HELICONE_API_KEY" }
      
      For Cohere integration:
      - Use the gateway approach with "https://gateway.helicone.ai"
      - Add headers:
        - "Helicone-Auth": "Bearer HELICONE_API_KEY"
        - "Helicone-Target-Url": "https://api.cohere.ai"
        - "Helicone-Target-Provider": "Cohere"
      
      For other providers:
      - Check if there's a dedicated Helicone domain (e.g., "https://[provider].helicone.ai")
      - If not, use the gateway approach with "https://gateway.helicone.ai"
      - Add appropriate Helicone headers
      
      Format your response in unified diff format like this:
      
      \`\`\`diff
      --- /path/to/file.ts
      +++ /path/to/file.ts
      @@ -10,6 +10,7 @@
       // Include several lines of unchanged context before your changes
       unchanged line
       unchanged line
      -line to remove
      +line to add
      +another line to add
       unchanged line
       // Include several lines of unchanged context after your changes
      \`\`\`
      
      Important diff formatting guidelines:
      1. Include at least 3 lines of unchanged context before and after each change
      2. Make sure the line numbers in the @@ header are accurate
      3. Use a single diff block per file, with multiple hunks if needed
      4. For each line you want to keep unchanged, prefix with a space
      5. For each line you want to remove, prefix with a minus (-)
      6. For each line you want to add, prefix with a plus (+)
      
      Also, specify any environment variables that need to be added, like this:
      
      Make sure to add the necessary environment variables:
      \`\`\`env
      HELICONE_API_KEY=your_helicone_api_key
      \`\`\`
      
      Begin your response with a brief overview of the changes needed to integrate Helicone.
    `;

    const response = await axios.post(
      `${GREPTILE_API_BASE}/query`,
      {
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
        repositories: [
          {
            remote,
            repository,
            branch,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${greptileApiKey}`,
          "X-Github-Token": githubToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to query repository: ${response.statusText}`);
    }

    addLog(integrationId, `Query completed successfully`);

    // Add the Greptile response message to the logs for debugging
    if (response.data.message) {
      addLog(integrationId, `response.data.message: ${response.data.message}`);
      // // Log the first 500 characters to give a preview
      // const previewMessage =
      //   response.data.message.substring(0, 500) +
      //   (response.data.message.length > 500 ? "..." : "");
      // addLog(integrationId, `Greptile response preview: ${previewMessage}`);

      // // Log the full message in chunks to avoid log size limitations
      // const messageChunks = chunkString(response.data.message, 1000);
      // messageChunks.forEach((chunk, index) => {
      //   addLog(
      //     integrationId,
      //     `Greptile response [part ${index + 1}/${
      //       messageChunks.length
      //     }]: ${chunk}`
      //   );
      // });
    } else {
      addLog(
        integrationId,
        `Warning: Greptile response did not contain a message`
      );
    }

    return response.data;
  } catch (error) {
    console.error("Error querying repository:", error);
    addLog(integrationId, `Error querying repository: ${error}`);
    throw error;
  }
}

// Function to create a pull request with Helicone integration
async function createPullRequest(
  repositoryUrl: string,
  queryResults: any,
  githubToken: string,
  integrationId: string
): Promise<string> {
  try {
    addLog(
      integrationId,
      `Preparing to create pull request for Helicone integration`
    );

    // Parse GitHub repository owner and name from URL
    const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub repository URL: ${repositoryUrl}`);
    }

    const [, owner, repo] = match;
    const octokit = new Octokit({ auth: githubToken });

    // Create a new branch
    const branchName = `helicone-integration-${Date.now()}`;
    addLog(integrationId, `Creating new branch: ${branchName}`);

    // Get the default branch
    const { data: repository } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repository.default_branch;

    // Get the SHA of the default branch
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });

    // Create a new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });

    // Process the query results and create commits
    addLog(integrationId, `Processing query results to create commits`);

    // Extract the response content from Greptile
    const assistantMessage = queryResults.message;
    if (!assistantMessage) {
      throw new Error("No response content found in query results");
    }

    addLog(integrationId, `Parsing Greptile response to identify file changes`);

    // Parse the response to identify file changes
    const fileChanges: {
      [filePath: string]: {
        content: string;
      };
    } = {};
    const envVariables: string[] = [];

    // Process the assistant message to extract file changes in diff format
    try {
      // Extract diff blocks
      const diffRegex = /```diff\n([\s\S]*?)```/g;
      let diffMatch;

      while ((diffMatch = diffRegex.exec(assistantMessage)) !== null) {
        const diffContent = diffMatch[1];

        // Parse the diff to get file path and changes
        const filePathRegex = /^--- \/?(.*?)\n\+\+\+ \/?(.*?)$/m;
        const filePathMatch = diffContent.match(filePathRegex);

        if (filePathMatch) {
          const filePath = filePathMatch[2]; // Use the target file path

          // Remove leading slash if present
          const normalizedPath = filePath.startsWith("/")
            ? filePath.substring(1)
            : filePath;

          addLog(
            integrationId,
            `Found diff changes for file: ${normalizedPath}`
          );

          // Validate the diff format
          const hunkHeaderRegex = /@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/;
          if (!hunkHeaderRegex.test(diffContent)) {
            addLog(
              integrationId,
              `Warning: Diff for ${normalizedPath} does not contain a valid hunk header. Skipping.`
            );
            continue;
          }

          // Store the diff content for this file
          fileChanges[normalizedPath] = {
            content: diffContent,
          };
        } else {
          addLog(
            integrationId,
            `Warning: Found diff block without valid file paths. Skipping.`
          );
        }
      }

      // If no file changes were found, log a warning
      if (Object.keys(fileChanges).length === 0) {
        addLog(
          integrationId,
          `Warning: No valid diff blocks found in the response. Check the response format.`
        );
      }

      // Look for environment variables
      const envVarRegex =
        /(?:Add|Set|Make sure to add) (?:the )?(?:necessary|following|these) environment variables:?\s*```(?:env)?\s*\n([\s\S]*?)\n```/i;
      const envVarMatch = assistantMessage.match(envVarRegex);
      if (envVarMatch) {
        const envVarText = envVarMatch[1].trim();
        const envVarLines = envVarText
          .split("\n")
          .filter((line: string) => line.trim() !== "");
        envVariables.push(...envVarLines);
        addLog(
          integrationId,
          `Found ${envVarLines.length} environment variables to add`
        );
      } else {
        // If no environment variables were found, add a default one
        envVariables.push("HELICONE_API_KEY=your_helicone_api_key");
        addLog(
          integrationId,
          `No environment variables found in response. Adding default HELICONE_API_KEY.`
        );
      }
    } catch (error) {
      console.error("Error parsing Greptile response:", error);
      addLog(integrationId, `Error parsing Greptile response: ${error}`);
    }

    // Create commits for each file change
    for (const [filePath, fileChange] of Object.entries(fileChanges)) {
      try {
        // Check if the file already exists
        let existingFile;
        let existingContent = "";
        let existingSha = "";

        try {
          const response = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branchName,
          });

          existingFile = response.data;

          if ("content" in existingFile) {
            existingContent = Buffer.from(
              existingFile.content,
              "base64"
            ).toString();
            existingSha = existingFile.sha;
            addLog(integrationId, `Found existing file: ${filePath}`);
          }
        } catch (error) {
          addLog(integrationId, `File does not exist yet: ${filePath}`);
          // File doesn't exist, will create it
        }

        // Apply the diff to the existing content
        let updatedContent = "";

        if (existingContent) {
          // Parse the diff to get the changes
          const diffContent = fileChange.content;
          addLog(
            integrationId,
            `Applying diff to ${filePath} using diff package`
          );

          try {
            // Parse the unified diff
            const patches = parsePatch(diffContent);

            // Apply the patches to the original content
            updatedContent = existingContent;
            for (const patch of patches) {
              try {
                const patchResult = applyPatch(updatedContent, patch);
                if (patchResult === false) {
                  throw new Error("Patch could not be applied");
                }
                updatedContent = patchResult;
                addLog(
                  integrationId,
                  `Successfully applied patch to ${filePath}`
                );
              } catch (patchError) {
                addLog(
                  integrationId,
                  `Warning: Error applying patch to ${filePath}: ${patchError}. Attempting fuzzy patch.`
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
                  addLog(
                    integrationId,
                    `Successfully applied fuzzy patch to ${filePath}`
                  );
                } catch (fuzzyError) {
                  addLog(
                    integrationId,
                    `Error: Failed to apply fuzzy patch to ${filePath}: ${fuzzyError}`
                  );
                  throw fuzzyError;
                }
              }
            }
          } catch (error) {
            console.error(`Error applying diff to ${filePath}:`, error);
            addLog(
              integrationId,
              `Error applying diff to ${filePath}: ${error}`
            );
            throw error;
          }
        } else {
          // If the file doesn't exist, we can't apply a diff
          // Instead, extract the '+' lines from the diff to create the file
          const diffContent = fileChange.content;

          try {
            // Parse the unified diff
            const patches = parsePatch(diffContent);

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
            addLog(
              integrationId,
              `Created new file content for ${filePath} from diff using diff package`
            );
          } catch (error) {
            console.error(
              `Error creating new file from diff for ${filePath}:`,
              error
            );
            addLog(
              integrationId,
              `Error creating new file from diff for ${filePath}: ${error}`
            );
            throw error;
          }
        }

        // Create or update the file
        if (existingSha) {
          // Update existing file
          addLog(integrationId, `Updating file: ${filePath}`);
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `Update ${filePath} with Helicone integration`,
            content: Buffer.from(updatedContent).toString("base64"),
            branch: branchName,
            sha: existingSha,
          });
        } else {
          // Create new file
          addLog(integrationId, `Creating new file: ${filePath}`);
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `Add ${filePath} with Helicone integration`,
            content: Buffer.from(updatedContent).toString("base64"),
            branch: branchName,
          });
        }
      } catch (error) {
        console.error(`Error updating file ${filePath}:`, error);
        addLog(integrationId, `Error updating file ${filePath}: ${error}`);
        // Continue with other files
      }
    }

    // Create or update .env.example with the environment variables
    if (envVariables.length > 0) {
      try {
        // Check if .env.example already exists
        try {
          const { data: existingEnvFile } = await octokit.repos.getContent({
            owner,
            repo,
            path: ".env.example",
            ref: branchName,
          });

          if ("content" in existingEnvFile) {
            // Update existing .env.example
            addLog(
              integrationId,
              `Updating .env.example with Helicone environment variables`
            );
            const existingContent = Buffer.from(
              existingEnvFile.content,
              "base64"
            ).toString();
            const updatedContent =
              existingContent +
              "\n\n# Helicone Integration\n" +
              envVariables.join("\n");

            await octokit.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: ".env.example",
              message:
                "Update .env.example with Helicone environment variables",
              content: Buffer.from(updatedContent).toString("base64"),
              branch: branchName,
              sha: existingEnvFile.sha,
            });
          }
        } catch (error) {
          // .env.example doesn't exist, create it
          addLog(
            integrationId,
            `Creating .env.example with Helicone environment variables`
          );
          const envContent =
            "# Helicone Integration\n" + envVariables.join("\n");

          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: ".env.example",
            message: "Add .env.example with Helicone environment variables",
            content: Buffer.from(envContent).toString("base64"),
            branch: branchName,
          });
        }
      } catch (error) {
        console.error("Error updating .env.example:", error);
        addLog(integrationId, `Error updating .env.example: ${error}`);
      }
    }

    // Create a pull request
    addLog(integrationId, `Creating pull request`);
    const { data: pullRequest } = await octokit.pulls.create({
      owner,
      repo,
      title: "Integrate Helicone for LLM API monitoring",
      body: `This pull request integrates Helicone for monitoring and analytics of LLM API calls using the proxy approach.

## Changes Made

- Modified API base URLs to use Helicone proxy endpoints
- Added Helicone authentication headers
- Configured environment variables for Helicone API key

## Getting Started

1. Sign up for a Helicone account at https://helicone.ai
2. Get your Helicone API key from the dashboard
3. Add the HELICONE_API_KEY to your environment variables

For more information, visit the [Helicone documentation](https://docs.helicone.ai).
`,
      head: branchName,
      base: defaultBranch,
    });

    addLog(integrationId, `Pull request created: ${pullRequest.html_url}`);

    // Mark as completed with PR URL
    updateStatus(
      integrationId,
      "Completed",
      100,
      true,
      undefined,
      pullRequest.html_url
    );

    return pullRequest.html_url;
  } catch (error: any) {
    console.error("Integration error:", error);

    // Mark as completed with error
    updateStatus(
      integrationId,
      "Error",
      100,
      true,
      error.message || "Unknown error"
    );

    throw error;
  }
}

// Main handler for the API endpoint
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { repositoryUrl, organizationId, greptileApiKey, githubToken } =
      req.body;

    // Validate required fields
    if (!repositoryUrl) {
      return res.status(400).json({
        success: false,
        error: "Repository URL is required",
      });
    }

    if (!greptileApiKey) {
      return res.status(400).json({
        success: false,
        error: "Greptile API key is required",
      });
    }

    if (!githubToken) {
      return res.status(400).json({
        success: false,
        error: "GitHub token is required",
      });
    }

    // Generate a unique ID for this integration
    const integrationId = uuidv4();

    // Initialize the integration status
    updateStatus(integrationId, "Initializing", 0);

    // Start the integration process in the background
    (async () => {
      try {
        // Check if the repository is already indexed by Greptile
        updateStatus(integrationId, "Checking repository status", 10);
        const { indexed, repoId: existingRepoId } = await checkRepositoryStatus(
          repositoryUrl,
          greptileApiKey,
          integrationId,
          githubToken
        );

        // If not indexed, start indexing
        let repoId = existingRepoId;
        let statusEndpoint;

        if (!indexed) {
          updateStatus(integrationId, "Starting repository indexing", 20);
          const indexingResult = await startIndexing(
            repositoryUrl,
            greptileApiKey,
            integrationId,
            githubToken
          );

          repoId = indexingResult.repoId;
          statusEndpoint = indexingResult.statusEndpoint;

          // Poll for indexing completion
          updateStatus(integrationId, "Indexing repository", 30);
          let indexingComplete = false;
          let attempts = 0;
          const maxAttempts = 30; // Maximum number of attempts (30 * 10 seconds = 5 minutes)

          while (!indexingComplete && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
            indexingComplete = await checkIndexingStatus(
              statusEndpoint,
              greptileApiKey,
              integrationId,
              githubToken
            );
            attempts++;

            // Update progress based on attempts
            const progress = Math.min(
              30 + Math.floor((attempts / maxAttempts) * 20),
              50
            );
            updateStatus(integrationId, "Indexing repository", progress);
          }

          if (!indexingComplete) {
            throw new Error("Repository indexing timed out after 5 minutes");
          }
        } else {
          updateStatus(integrationId, "Repository already indexed", 50);
          // For already indexed repositories, construct the status endpoint
          statusEndpoint = `${GREPTILE_API_BASE}/repositories/${repoId}`;
        }

        // Query the repository for Helicone integration
        updateStatus(
          integrationId,
          "Analyzing repository for LLM API calls",
          60
        );
        const queryResults = await queryForHeliconeIntegration(
          repoId!,
          greptileApiKey,
          integrationId,
          githubToken
        );

        // Create a pull request with the changes
        updateStatus(integrationId, "Creating pull request", 80);
        const prUrl = await createPullRequest(
          repositoryUrl,
          queryResults,
          githubToken,
          integrationId
        );

        // Mark as completed with PR URL
        updateStatus(integrationId, "Completed", 100, true, undefined, prUrl);
      } catch (error: any) {
        console.error("Integration error:", error);

        // Mark as completed with error
        updateStatus(
          integrationId,
          "Error",
          100,
          true,
          error.message || "Unknown error"
        );
      }
    })();

    // Return the integration ID to the client
    return res.status(200).json({
      success: true,
      message: "Integration started",
      integrationId,
    });
  } catch (error: any) {
    console.error("Error handling request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
}
