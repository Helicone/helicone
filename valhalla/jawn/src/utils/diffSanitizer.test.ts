import { describe, expect, it } from "@jest/globals";
import {
  sanitizeFilePath,
  sanitizeDiffContent,
  isValidDiff,
  extractAddedLines,
  manuallyExtractCode,
  extractFinalContent,
  fixUnparsableDiff,
  createCleanDiff,
} from "./diffSanitizer";

describe("diffSanitizer", () => {
  describe("sanitizeFilePath", () => {
    it("should remove a/ prefix from file paths", () => {
      expect(sanitizeFilePath("a/lib/debate/api-clients.ts")).toBe(
        "lib/debate/api-clients.ts"
      );
    });

    it("should remove b/ prefix from file paths", () => {
      expect(sanitizeFilePath("b/lib/debate/api-clients.ts")).toBe(
        "lib/debate/api-clients.ts"
      );
    });

    it("should not modify paths without a/ or b/ prefixes", () => {
      expect(sanitizeFilePath("lib/debate/api-clients.ts")).toBe(
        "lib/debate/api-clients.ts"
      );
    });
  });

  describe("sanitizeDiffContent", () => {
    it("should normalize line endings", () => {
      const input = "line1\r\nline2\r\nline3";
      const expected = " line1\n line2\n line3";
      expect(sanitizeDiffContent(input)).toBe(expected);
    });

    it("should remove spaces after +/- at the beginning of lines", () => {
      const input = "+ added line\n- removed line";
      const expected = "+added line\n-removed line";
      expect(sanitizeDiffContent(input)).toBe(expected);
    });

    it("should add spaces before context lines", () => {
      const input = "context line";
      const expected = " context line";
      expect(sanitizeDiffContent(input)).toBe(expected);
    });

    it("should fix hunk headers with missing line counts", () => {
      const input = "@@ -10 +20 @@";
      const expected = " @@ -10,1 +20,1 @@";
      expect(sanitizeDiffContent(input)).toBe(expected);
    });
  });

  describe("isValidDiff", () => {
    it("should return true for valid diffs", () => {
      const validDiff = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 context
-removed
+added
+another added
 context`;
      expect(isValidDiff(validDiff)).toBe(true);
    });

    it("should return false for invalid diffs", () => {
      const invalidDiff = `not a diff`;
      expect(isValidDiff(invalidDiff)).toBe(false);
    });
  });

  // Real-world example from the logs
  const realWorldDiff = `--- a/lib/debate/api-clients.ts
+++ b/lib/debate/api-clients.ts
@@ -3,13 +3,15 @@ import { createOpenRouter } from "@openrouter/ai-sdk-provider";
 import { createPerplexity } from "@ai-sdk/perplexity";
 
 // OpenRouter API client for accessing Gemini
 export const openrouter = createOpenRouter({
-  baseURL: "https://openrouter.helicone.ai/api/v1",
-  apiKey: process.env.OPENROUTER_API_KEY || "",
+  baseURL: "https://gateway.helicone.ai",
+  apiKey: process.env.OPENROUTER_API_KEY || "", 
+  headers: {
+    "Helicone-Auth": \`Bearer \${process.env.HELICONE_API_KEY}\`,
+    "Helicone-Target-Url": "https://openrouter.ai/api/v1",
+    "Helicone-Target-Provider": "OpenRouter"
+  }
 });
 
 // Perplexity API client for research capabilities
 export const perplexity = createPerplexity({
-  baseURL: "https://perplexity.helicone.ai",
-  apiKey: process.env.PERPLEXITY_API_KEY || "",
+  baseURL: "https://gateway.helicone.ai",
+  apiKey: process.env.PERPLEXITY_API_KEY || "",
+  headers: {
+    "Helicone-Auth": \`Bearer \${process.env.HELICONE_API_KEY}\`,
+    "Helicone-Target-Url": "https://api.perplexity.ai",
+    "Helicone-Target-Provider": "Perplexity"
+  }
 });`;

  describe("extractAddedLines", () => {
    it("should extract added lines from a diff", () => {
      const diff = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 context
-removed
+added
+another added
 context`;
      const expected = ["added", "another added"];
      expect(extractAddedLines(diff)).toEqual(expected);
    });

    it("should extract added lines from the real-world example", () => {
      const addedLines = extractAddedLines(realWorldDiff);
      expect(addedLines).toContain('  baseURL: "https://gateway.helicone.ai",');
      expect(addedLines).toContain("  headers: {");
      expect(addedLines).toContain(
        '    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,'
      );
      expect(addedLines.length).toBeGreaterThan(5);
    });
  });

  describe("manuallyExtractCode", () => {
    it("should extract code from a diff ignoring diff syntax", () => {
      const diff = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 context
-removed
+added
+another added
 context`;
      const expected = ["context", "added", "another added", "context"];
      expect(manuallyExtractCode(diff)).toEqual(expected);
    });

    it("should extract code from the real-world example", () => {
      const code = manuallyExtractCode(realWorldDiff);
      expect(code).toContain(
        'import { createPerplexity } from "@ai-sdk/perplexity";'
      );
      expect(code).toContain("export const openrouter = createOpenRouter({");
      expect(code).toContain('  baseURL: "https://gateway.helicone.ai",');
      expect(code.length).toBeGreaterThan(10);
    });
  });

  describe("extractFinalContent", () => {
    it("should extract the final content after applying a diff", () => {
      const diff = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 context
-removed
+added
+another added
 context`;
      const expected = ["context", "added", "another added", "context"];
      expect(extractFinalContent(diff)).toEqual(expected);
    });

    it("should extract the final content from the real-world example", () => {
      const finalContent = extractFinalContent(realWorldDiff);
      expect(finalContent).toContain(
        'import { createPerplexity } from "@ai-sdk/perplexity";'
      );
      expect(finalContent).toContain(
        '  baseURL: "https://gateway.helicone.ai",'
      );
      expect(finalContent).toContain("  headers: {");
      expect(finalContent).not.toContain(
        '  baseURL: "https://openrouter.helicone.ai/api/v1",'
      );
      expect(finalContent.length).toBeGreaterThan(10);
    });
  });

  describe("fixUnparsableDiff", () => {
    it("should fix a diff with invalid hunk headers", () => {
      const invalidDiff = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,5 @@
 context
-removed
+added
+another added
 context`;
      const fixed = fixUnparsableDiff(invalidDiff, "file.txt");
      expect(isValidDiff(fixed)).toBe(true);
    });

    it("should create a valid diff from the real-world example even if it has issues", () => {
      // Introduce an error in the real-world diff to test fixing
      const brokenDiff = realWorldDiff.replace(
        "@@ -3,13 +3,15 @@",
        "@@ -3,13 +3,20 @@"
      ); // Incorrect line count
      const fixed = fixUnparsableDiff(brokenDiff, "lib/debate/api-clients.ts");
      expect(isValidDiff(fixed)).toBe(true);
    });
  });

  describe("createCleanDiff", () => {
    it("should create a clean diff from added and removed lines", () => {
      const addedLines = ["added", "another added"];
      const removedLines = ["removed"];
      const filePath = "file.txt";
      const expected = `--- a/file.txt
+++ b/file.txt
@@ -1,1 +1,2 @@
-removed
+added
+another added`;
      expect(createCleanDiff(filePath, addedLines, removedLines)).toBe(
        expected
      );
    });
  });

  describe("Integration tests with real-world examples", () => {
    // This is the full Greptile response from the logs
    const fullGreptileResponse = `Based on the provided codebase, I'll outline the necessary changes to integrate Helicone with the existing LLM API calls. The codebase primarily uses OpenRouter and Perplexity APIs, which can be integrated with Helicone through the proxy approach.

Overview of Changes:
- Modify the OpenRouter API client configuration in api-clients.ts to use Helicone's proxy
- Update the Perplexity API client configuration to use Helicone's proxy
- Add necessary Helicone authentication headers
- Configure required environment variables

Here are the specific changes needed:

\`\`\`diff
--- a/lib/debate/api-clients.ts
+++ b/lib/debate/api-clients.ts
@@ -3,13 +3,15 @@ import { createOpenRouter } from "@openrouter/ai-sdk-provider";
 import { createPerplexity } from "@ai-sdk/perplexity";
 
 // OpenRouter API client for accessing Gemini
 export const openrouter = createOpenRouter({
-  baseURL: "https://openrouter.helicone.ai/api/v1",
-  apiKey: process.env.OPENROUTER_API_KEY || "",
+  baseURL: "https://gateway.helicone.ai",
+  apiKey: process.env.OPENROUTER_API_KEY || "", 
+  headers: {
+    "Helicone-Auth": \`Bearer \${process.env.HELICONE_API_KEY}\`,
+    "Helicone-Target-Url": "https://openrouter.ai/api/v1",
+    "Helicone-Target-Provider": "OpenRouter"
+  }
 });
 
 // Perplexity API client for research capabilities
 export const perplexity = createPerplexity({
-  baseURL: "https://perplexity.helicone.ai",
-  apiKey: process.env.PERPLEXITY_API_KEY || "",
+  baseURL: "https://gateway.helicone.ai",
+  apiKey: process.env.PERPLEXITY_API_KEY || "",
+  headers: {
+    "Helicone-Auth": \`Bearer \${process.env.HELICONE_API_KEY}\`,
+    "Helicone-Target-Url": "https://api.perplexity.ai",
+    "Helicone-Target-Provider": "Perplexity"
+  }
 });
\`\`\`

Make sure to add the necessary environment variables:
\`\`\`env
HELICONE_API_KEY=your_helicone_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
\`\`\`

The changes above will:
1. Redirect OpenRouter API calls through Helicone's gateway proxy
2. Redirect Perplexity API calls through Helicone's gateway proxy
3. Add proper Helicone authentication and routing headers
4. Maintain existing API key authentication for the underlying services

Note that both API clients are used throughout the codebase in files like research.ts and simulation.ts, but the changes only need to be made in api-clients.ts since that's where the client configurations are centralized.

These changes will enable Helicone's monitoring, logging, and analytics features for all API calls made through these clients while maintaining the existing functionality of the application.`;

    it("should extract file changes from a full Greptile response", () => {
      // This simulates the extractFileChanges method in GitHubIntegrationService
      const diffRegex = /```diff\n([\s\S]*?)```/g;
      let diffMatch = diffRegex.exec(fullGreptileResponse);

      expect(diffMatch).not.toBeNull();
      if (diffMatch) {
        const diffContent = diffMatch[1];

        // Test sanitization
        const sanitizedDiff = sanitizeDiffContent(diffContent);
        expect(sanitizedDiff).not.toBe("");

        // Test validation
        const isValid = isValidDiff(sanitizedDiff);

        // If not valid, test fixing
        let finalDiff = sanitizedDiff;
        if (!isValid) {
          finalDiff = fixUnparsableDiff(
            sanitizedDiff,
            "lib/debate/api-clients.ts"
          );
          expect(isValidDiff(finalDiff)).toBe(true);
        }

        // Test content extraction
        const addedLines = extractAddedLines(finalDiff);
        expect(addedLines.length).toBeGreaterThan(0);

        const finalContent = extractFinalContent(finalDiff);
        expect(finalContent.length).toBeGreaterThan(0);

        // Verify we can extract the key changes
        expect(finalContent.join("\n")).toContain(
          'baseURL: "https://gateway.helicone.ai"'
        );
        expect(finalContent.join("\n")).toContain("Helicone-Auth");
      }
    });
  });
});
