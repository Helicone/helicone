import * as path from "path";
import { FeaturePromptService } from "./FeaturePromptService";
import { Project, Node, SourceFile } from "ts-morph";
import * as os from "os";
import simpleGit from "simple-git";
import {
  extractAstTransformations,
  getFeatureName,
} from "../../utils/diffExtractor";
import * as ts from "typescript";

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
      await this.updateStatus(
        integrationId,
        "Querying for integration instructions...",
        40
      );

      const decodedRepoId = decodeURIComponent(repoId);
      const [remote, branch, repository] = decodedRepoId.split(":");

      // Step 2: Generate the main prompt incorporating provider-specific instructions
      const introContent = this.featurePromptService.readPromptFile(
        "heliconeGeneralIntegration.md"
      );

      const outputFormatContent = this.featurePromptService.readPromptFile(
        "heliconeOutputFormat.md"
      );

      // Add feature-specific content if any features were selected
      let featureSpecificContent = "";
      if (selectedFeatures && selectedFeatures.length > 0) {
        featureSpecificContent += "\n\n## Selected Feature Instructions\n";

        for (const featureId of selectedFeatures) {
          try {
            // Construct the feature prompt file path
            const featurePromptFile = `features/helicone${
              featureId.charAt(0).toUpperCase() +
              featureId.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            }.md`;

            const featureContent =
              this.featurePromptService.readPromptFile(featurePromptFile);
            const featureName = getFeatureName(featureId);
            featureSpecificContent += `\n### ${featureName}\n${featureContent}\n`;

            await this.addLog(
              integrationId,
              `Added feature instructions for ${featureName}`
            );
          } catch (featureError) {
            await this.addLog(
              integrationId,
              `Error loading feature instructions for ${featureId}: ${featureError}`
            );
          }
        }
      }

      const promptContent = `${introContent}

## Repository Analysis Results
Based on our analysis, your codebase uses the following:

${featureSpecificContent}

${outputFormatContent}`;

      console.log("PROMPT CONTENT:", promptContent);
      await this.addLog(integrationId, `Generated final integration prompt`);

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

      // Check if we have a valid response
      if (!queryResults.message) {
        throw new Error("No message in Greptile response");
      }

      // Parse the repository URL
      const repoUrl = new URL(repositoryUrl);
      const pathSegments = repoUrl.pathname.split("/");
      const owner = pathSegments[1];
      const repo = pathSegments[2];

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
      const repoInfo = await githubFetch(`/repos/${owner}/${repo}`);
      const defaultBranch = repoInfo.default_branch;

      // Get the latest commit SHA from the default branch
      const refData = await githubFetch(
        `/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`
      );
      const latestCommitSha = refData.object.sha;

      // Create a new branch reference
      await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: latestCommitSha,
        }),
      });

      await this.addLog(
        integrationId,
        `Extracting AST transformations from Greptile response`
      );

      // Extract AST transformations from the message
      const transformations = extractAstTransformations(queryResults.message);

      if (transformations.length === 0) {
        throw new Error(
          "No valid AST transformations found in Greptile response"
        );
      }

      await this.addLog(
        integrationId,
        `Found ${transformations.length} AST transformations to apply`
      );

      // Clone the repository locally to apply transformations
      const repoDir = path.join(
        os.tmpdir(),
        `helicone-integration-${Date.now()}`
      );

      await this.addLog(integrationId, `Cloning repository to ${repoDir}`);

      // Use simple-git to clone the repository
      const git = simpleGit();
      await git.clone(repositoryUrl, repoDir);
      await git.cwd(repoDir);
      await git.checkout([branchName]);

      // Apply the AST transformations
      const success = await this.processAstTransformations(
        transformations,
        repoDir,
        integrationId
      );

      if (!success) {
        throw new Error("Failed to apply AST transformations");
      }

      // Commit the changes
      await this.addLog(integrationId, `Committing changes`);
      await git.add(".");
      await git.commit("Add Helicone integration");

      // Push the changes
      await this.addLog(integrationId, `Pushing changes to GitHub`);
      await git.push("origin", branchName);

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
- Added environment variables

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

  // Extract AST transformations from Greptile response message

  // Helper method to get feature name from ID

  // Process AST transformations
  private async processAstTransformations(
    transformations: any[],
    repositoryPath: string,
    integrationId: string
  ): Promise<boolean> {
    try {
      await this.addLog(
        integrationId,
        `Processing ${transformations.length} AST transformations`
      );

      // Group transformations by file
      const transformationsByFile: { [file: string]: any } = {};

      for (const transformation of transformations) {
        const filePath = transformation.file;
        if (!transformationsByFile[filePath]) {
          transformationsByFile[filePath] = {
            file: filePath,
            transformations: [],
          };
        }

        // Add all transformations for this file
        if (
          transformation.transformations &&
          Array.isArray(transformation.transformations)
        ) {
          transformationsByFile[filePath].transformations.push(
            ...transformation.transformations
          );
        }
      }

      // Process each file's transformations
      for (const filePath in transformationsByFile) {
        const absolutePath = path.join(repositoryPath, filePath);
        const fileTransformations = transformationsByFile[filePath];

        // Determine file type and use appropriate processor
        if (
          filePath.endsWith(".ts") ||
          filePath.endsWith(".tsx") ||
          filePath.endsWith(".js") ||
          filePath.endsWith(".jsx")
        ) {
          await this.applyTypeScriptTransformations(
            absolutePath,
            fileTransformations,
            integrationId
          );
        } else if (filePath.endsWith(".json")) {
          await this.applyJsonTransformations(
            absolutePath,
            fileTransformations,
            integrationId
          );
        } else {
          // Assume it's a text file (.md, .env, etc.)
          await this.applyTextTransformations(
            absolutePath,
            fileTransformations,
            integrationId
          );
        }
      }

      return true;
    } catch (error: any) {
      console.error("Error processing AST transformations:", error);
      await this.addLog(
        integrationId,
        `Error processing AST transformations: ${error.message}`
      );
      return false;
    }
  }

  // Apply transformations to TypeScript/JavaScript files
  private async applyTypeScriptTransformations(
    filePath: string,
    transformations: { file: string; transformations: any[] },
    integrationId: string
  ): Promise<void> {
    try {
      await this.addLog(
        integrationId,
        `Applying TypeScript transformations to ${path.basename(filePath)}`
      );

      // Initialize ts-morph project
      const project = new Project();

      // Add the file to the project
      const sourceFile = project.addSourceFileAtPath(filePath);

      // Process each transformation
      for (const transformation of transformations.transformations || []) {
        await this.applyTransformation(
          sourceFile,
          transformation,
          integrationId
        );
      }

      // Save the changes
      await sourceFile.save();

      await this.addLog(
        integrationId,
        `Successfully applied TypeScript transformations to ${path.basename(
          filePath
        )}`
      );
    } catch (error: any) {
      console.error(
        `Error applying TypeScript transformations to ${filePath}:`,
        error
      );
      await this.addLog(
        integrationId,
        `Error applying TypeScript transformations to ${path.basename(
          filePath
        )}: ${error.message}`
      );
      throw error;
    }
  }

  // Apply a single transformation to a source file
  private async applyTransformation(
    sourceFile: SourceFile,
    transformation: any,
    integrationId: string
  ): Promise<void> {
    try {
      const transformationType = transformation.type;

      switch (transformationType) {
        case "add_import":
          await this.addImportDeclaration(
            sourceFile,
            transformation,
            integrationId
          );
          break;

        case "modify_imports":
          // Handle modify_imports as add_import for backward compatibility
          if (transformation.content) {
            await this.addImportDeclaration(
              sourceFile,
              { import_statement: transformation.content },
              integrationId
            );
          }
          break;

        case "add_code_after_imports":
          await this.addCodeAfterImports(
            sourceFile,
            transformation,
            integrationId
          );
          break;

        case "add_object_property":
          await this.addObjectProperty(
            sourceFile,
            transformation,
            integrationId
          );
          break;

        case "add_function_call_property":
          await this.addFunctionCallProperty(
            sourceFile,
            transformation,
            integrationId
          );
          break;

        case "modify_client":
          await this.modifyClient(sourceFile, transformation, integrationId);
          break;

        default:
          await this.addLog(
            integrationId,
            `Unknown transformation type: ${transformationType}`
          );
          break;
      }
    } catch (error: any) {
      await this.addLog(
        integrationId,
        `Error applying transformation: ${error.message}`
      );
      throw error;
    }
  }

  // Add an import declaration to a source file
  private async addImportDeclaration(
    sourceFile: SourceFile,
    transformation: any,
    integrationId: string
  ): Promise<void> {
    try {
      const importStatement = transformation.import_statement;

      // Check if the import already exists
      const existingImports = sourceFile.getImportDeclarations();
      const importText = importStatement.trim();

      // Extract the module name from the import statement
      const moduleMatch = importText.match(/from\s+['"]([^'"]+)['"]/);
      const importedModule = moduleMatch ? moduleMatch[1] : null;

      // Extract the imported items from the import statement
      const itemsMatch = importText.match(/import\s+{([^}]+)}/);
      const importedItems: string[] = itemsMatch
        ? itemsMatch[1]
            .trim()
            .split(",")
            .map((item: string) => item.trim())
        : [];

      // Check if this import already exists
      let importExists = false;

      if (importedModule) {
        for (const existingImport of existingImports) {
          const existingModuleName = existingImport.getModuleSpecifierValue();

          if (existingModuleName === importedModule) {
            // If it's a named import, check if all items are already imported
            if (importedItems.length > 0) {
              const existingNamedImports = existingImport
                .getNamedImports()
                .map((ni) => ni.getName());
              const allItemsExist = importedItems.every((item: string) => {
                // Handle aliases and spaces
                const cleanItem = item.split(" as ")[0].trim();
                return existingNamedImports.includes(cleanItem);
              });

              if (allItemsExist) {
                importExists = true;
                break;
              }
            } else {
              // For default imports or namespace imports, consider it exists
              importExists = true;
              break;
            }
          }
        }
      }

      if (importExists) {
        await this.addLog(
          integrationId,
          `Import already exists: ${importText}`
        );
        return;
      }

      // Add the import declaration at the top of the file
      sourceFile.addImportDeclaration({
        isTypeOnly: importStatement.includes("import type"),
        moduleSpecifier: importedModule || "",
        leadingTrivia: (writer) => writer.newLine(),
      });

      // Get the newly added import declaration
      const importDeclarations = sourceFile.getImportDeclarations();
      const lastImport = importDeclarations[importDeclarations.length - 1];

      // Replace it with the full import statement to handle complex cases
      lastImport.replaceWithText(importStatement);

      await this.addLog(integrationId, `Added import: ${importStatement}`);
    } catch (error: any) {
      await this.addLog(
        integrationId,
        `Error adding import declaration: ${error.message}`
      );
      throw error;
    }
  }

  // Add code after imports
  private async addCodeAfterImports(
    sourceFile: SourceFile,
    transformation: any,
    integrationId: string
  ): Promise<void> {
    const { code } = transformation;

    const imports = sourceFile.getImportDeclarations();
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      sourceFile.insertText(lastImport.getEnd() + 1, "\n\n" + code + "\n");
    } else {
      sourceFile.insertText(0, code + "\n\n");
    }

    await this.addLog(integrationId, `Added code after imports`);
  }

  // Add a property to an object in a variable declaration
  private async addObjectProperty(
    sourceFile: SourceFile,
    transformation: any,
    integrationId: string
  ): Promise<void> {
    const { target, property_name, property_value } = transformation;

    // Find variable declarations matching the target
    sourceFile.getVariableDeclarations().forEach((varDecl: any) => {
      if (varDecl.getName() === target.name) {
        // Find the call expression within the variable declaration
        const initializer = varDecl.getInitializer();

        if (initializer && Node.isCallExpression(initializer)) {
          const expression = initializer.getExpression();
          let match = false;

          // Check if the function name matches
          if (
            Node.isIdentifier(expression) &&
            expression.getText() === target.object_name
          ) {
            match = true;
          }

          if (match) {
            // Get the first argument of the call expression (should be an object literal)
            const args = initializer.getArguments();

            if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
              const objLiteral = args[0];

              // Check if the property already exists
              const existingProp = objLiteral.getProperty(property_name);

              if (!existingProp) {
                // Add the property
                objLiteral.addPropertyAssignment({
                  name: property_name,
                  initializer: property_value,
                });

                console.log(
                  `Added ${property_name} property to ${target.name}`
                );
              }
            }
          }
        }
      }
    });
  }

  // Add a property to a function call
  private async addFunctionCallProperty(
    sourceFile: SourceFile,
    transformation: any,
    integrationId: string
  ): Promise<void> {
    const { target, property_name, property_value } = transformation;

    // Determine the search scope
    let searchScope: Node = sourceFile;

    // If we're targeting a specific function, narrow the search scope
    if (target.containing_function) {
      const containingFunction = sourceFile
        .getFunctions()
        .find((func: any) => func.getName() === target.containing_function);

      if (!containingFunction) {
        await this.addLog(
          integrationId,
          `Warning: Could not find containing function ${target.containing_function}`
        );
        return;
      }

      searchScope = containingFunction;
    }

    // Find all call expressions that match our criteria
    searchScope.forEachDescendant((node: Node) => {
      if (Node.isCallExpression(node)) {
        let match = false;

        // Check function name
        const expression = node.getExpression();

        // Direct function call: functionName()
        if (
          Node.isIdentifier(expression) &&
          expression.getText() === target.function_name
        ) {
          match = true;
        }

        // Method call: object.methodName()
        if (Node.isPropertyAccessExpression(expression)) {
          const methodName = expression.getName();
          const object = expression.getExpression();

          if (
            methodName === target.method_name &&
            Node.isIdentifier(object) &&
            object.getText() === target.function_name
          ) {
            match = true;
          }
        }

        if (match) {
          // Get the first argument of the call expression (should be an object literal)
          const args = node.getArguments();

          if (args.length > 0 && Node.isObjectLiteralExpression(args[0])) {
            const objLiteral = args[0];

            // Check if the property already exists
            const existingProp = objLiteral.getProperty(property_name);

            if (!existingProp) {
              // Add the property
              objLiteral.addPropertyAssignment({
                name: property_name,
                initializer: property_value,
              });

              console.log(
                `Added ${property_name} property to ${target.function_name} call`
              );
            }
          }
        }
      }
    });
  }

  // Handle modify_client transformation using text manipulation
  private async modifyClient(
    sourceFile: SourceFile,
    transformation: any,
    integrationId: string
  ): Promise<void> {
    try {
      const target = transformation.target;
      const changes = transformation.changes || {};

      await this.addLog(integrationId, `Modifying client: ${target}`);

      // Get the file text
      let fileText = sourceFile.getFullText();

      // Find the client variable declaration
      const clientRegex = new RegExp(
        `(const|let|var)\\s+${target}\\s*=\\s*`,
        "g"
      );
      const match = clientRegex.exec(fileText);

      if (!match) {
        await this.addLog(
          integrationId,
          `Could not find client variable: ${target}`
        );
        return;
      }

      // Find the opening brace of the client configuration
      const startPos = match.index + match[0].length;
      let openBracePos = fileText.indexOf("{", startPos);

      if (openBracePos === -1) {
        await this.addLog(
          integrationId,
          `Could not find client configuration object for: ${target}`
        );
        return;
      }

      // Find the matching closing brace
      let braceCount = 1;
      let closeBracePos = openBracePos + 1;

      while (braceCount > 0 && closeBracePos < fileText.length) {
        if (fileText[closeBracePos] === "{") {
          braceCount++;
        } else if (fileText[closeBracePos] === "}") {
          braceCount--;
        }
        closeBracePos++;
      }

      if (braceCount !== 0) {
        await this.addLog(
          integrationId,
          `Could not find end of client configuration object for: ${target}`
        );
        return;
      }

      // Extract the client configuration
      const configText = fileText.substring(openBracePos, closeBracePos);

      // Create the modified configuration
      let modifiedConfig = configText;

      // Apply baseURL change if specified
      if (changes.baseURL) {
        const baseUrlRegex = /baseURL\s*:\s*["']([^"']*)["']/;
        if (baseUrlRegex.test(modifiedConfig)) {
          // Replace existing baseURL
          modifiedConfig = modifiedConfig.replace(
            baseUrlRegex,
            `baseURL: "${changes.baseURL}"`
          );
        } else {
          // Add baseURL property
          modifiedConfig = modifiedConfig.replace(
            "{",
            `{\n  baseURL: "${changes.baseURL}",`
          );
        }
      }

      // Apply headers changes if specified
      if (changes.headers) {
        const headersRegex = /headers\s*:\s*{([^}]*)}/;
        const headersMatch = headersRegex.exec(modifiedConfig);

        if (headersMatch) {
          // Headers property exists, modify it
          let headersText = headersMatch[1];

          // Add each header
          for (const [key, value] of Object.entries(changes.headers)) {
            const headerRegex = new RegExp(
              `["']${key}["']\\s*:\\s*["'][^"']*["']`
            );

            if (headerRegex.test(headersText)) {
              // Replace existing header
              headersText = headersText.replace(
                headerRegex,
                `"${key}": "${value}"`
              );
            } else {
              // Add new header
              headersText += `,\n    "${key}": "${value}"`;
            }
          }

          // Replace headers in the config
          modifiedConfig = modifiedConfig.replace(
            headersRegex,
            `headers: {${headersText}}`
          );
        } else {
          // Headers property doesn't exist, add it
          let headersText = "\n  headers: {\n";

          for (const [key, value] of Object.entries(changes.headers)) {
            headersText += `    "${key}": "${value}",\n`;
          }

          headersText += "  }";

          // Add headers property after the opening brace or after baseURL if it was added
          if (modifiedConfig.includes("baseURL:")) {
            modifiedConfig = modifiedConfig.replace(
              /baseURL:[^,]*,/,
              (match) => `${match}${headersText},`
            );
          } else {
            modifiedConfig = modifiedConfig.replace("{", `{${headersText},`);
          }
        }
      }

      // Replace the original configuration with the modified one
      fileText =
        fileText.substring(0, openBracePos) +
        modifiedConfig +
        fileText.substring(closeBracePos);

      // Update the source file
      sourceFile.replaceWithText(fileText);

      await this.addLog(
        integrationId,
        `Successfully modified client: ${target}`
      );
    } catch (error: any) {
      await this.addLog(
        integrationId,
        `Error modifying client: ${error.message}`
      );
      throw error;
    }
  }

  // Apply transformations to JSON files
  private async applyJsonTransformations(
    filePath: string,
    transformations: { file: string; transformations: any[] },
    integrationId: string
  ): Promise<void> {
    try {
      await this.addLog(
        integrationId,
        `Applying JSON transformations to ${path.basename(filePath)}`
      );

      // Read the JSON file
      const fs = require("fs");
      const jsonContent = fs.readFileSync(filePath, "utf8");
      const jsonData = JSON.parse(jsonContent);

      let modified = false;

      // Process each transformation
      for (const transformation of transformations.transformations || []) {
        switch (transformation.type) {
          case "add_package_dependency":
            if (!jsonData.dependencies) {
              jsonData.dependencies = {};
            }

            if (!jsonData.dependencies[transformation.dependency_name]) {
              jsonData.dependencies[transformation.dependency_name] =
                transformation.dependency_version;
              modified = true;
              console.log(
                `Added ${transformation.dependency_name} to dependencies`
              );
            }
            break;

          case "add_dev_dependency":
            if (!jsonData.devDependencies) {
              jsonData.devDependencies = {};
            }

            if (!jsonData.devDependencies[transformation.dependency_name]) {
              jsonData.devDependencies[transformation.dependency_name] =
                transformation.dependency_version;
              modified = true;
              console.log(
                `Added ${transformation.dependency_name} to devDependencies`
              );
            }
            break;

          default:
            await this.addLog(
              integrationId,
              `Warning: Unsupported JSON transformation type: ${transformation.type}`
            );
        }
      }

      // Write the modified JSON back to the file
      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

        await this.addLog(
          integrationId,
          `Successfully applied JSON transformations to ${path.basename(
            filePath
          )}`
        );
      }
    } catch (error: any) {
      console.error(
        `Error applying JSON transformations to ${filePath}:`,
        error
      );
      await this.addLog(
        integrationId,
        `Error applying JSON transformations to ${path.basename(filePath)}: ${
          error.message
        }`
      );
      throw error;
    }
  }

  // Apply transformations to text files (like .env)
  private async applyTextTransformations(
    filePath: string,
    transformations: { file: string; transformations: any[] },
    integrationId: string
  ): Promise<void> {
    try {
      // Read the file content or create an empty file if it doesn't exist
      const fs = require("fs");
      let fileContent = "";

      try {
        fileContent = fs.readFileSync(filePath, "utf8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          // File doesn't exist, create the directory if needed
          const path = require("path");
          const dirPath = path.dirname(filePath);

          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }

          await this.addLog(
            integrationId,
            `Creating new file: ${transformations.file}`
          );
        } else {
          throw error;
        }
      }

      // Apply each transformation
      for (const transformation of transformations.transformations) {
        const transformationType = transformation.type;

        switch (transformationType) {
          case "add_section":
            // Add a new section to the file
            const sectionTitle = transformation.title || "";
            const sectionContent = transformation.content || "";

            if (fileContent.includes(sectionTitle)) {
              await this.addLog(
                integrationId,
                `Section "${sectionTitle}" already exists in ${transformations.file}`
              );
            } else {
              fileContent += `\n\n${sectionTitle}\n${sectionContent}`;
              await this.addLog(
                integrationId,
                `Added section "${sectionTitle}" to ${transformations.file}`
              );
            }
            break;

          case "add_env_variable":
            // Add an environment variable to the file
            const variableName = transformation.variable_name || "";
            const variableValue =
              transformation.variable_value || "your_value_here";

            if (!variableName) {
              await this.addLog(
                integrationId,
                `No variable name provided for add_env_variable in ${transformations.file}`
              );
              break;
            }

            const envVarLine = `${variableName}=${variableValue}`;

            if (fileContent.includes(variableName + "=")) {
              await this.addLog(
                integrationId,
                `Environment variable ${variableName} already exists in ${transformations.file}`
              );
            } else {
              // Add a newline if the file doesn't end with one
              if (fileContent && !fileContent.endsWith("\n")) {
                fileContent += "\n";
              }

              // Add a comment if this is the first Helicone variable
              if (
                variableName === "HELICONE_API_KEY" &&
                !fileContent.includes("HELICONE_")
              ) {
                fileContent += "\n# Helicone Configuration\n";
              }

              fileContent += `${envVarLine}\n`;

              await this.addLog(
                integrationId,
                `Added environment variable ${variableName} to ${transformations.file}`
              );
            }
            break;

          case "add_content":
            // Add content to the file
            const content = transformation.content || "";
            fileContent += content;
            await this.addLog(
              integrationId,
              `Added content to ${transformations.file}`
            );
            break;

          default:
            await this.addLog(
              integrationId,
              `Unknown text transformation type: ${transformationType}`
            );
            break;
        }
      }

      // Write the modified content back to the file
      fs.writeFileSync(filePath, fileContent);
      await this.addLog(
        integrationId,
        `Successfully applied text transformations to ${transformations.file}`
      );
    } catch (error: any) {
      await this.addLog(
        integrationId,
        `Error applying text transformations to ${transformations.file}: ${error.message}`
      );
      throw error;
    }
  }
}
