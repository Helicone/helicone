## Output Format

IMPORTANT: Your response MUST include code changes in the standard unified diff format. Follow these strict formatting rules:

1. Begin with a brief overview of the changes needed to integrate Helicone
2. Identify which LLM providers are used in the codebase
3. For each provider, provide a diff showing the required changes
4. Each diff block must start with `diff and end with `
5. File paths must use the format: --- a/path/to/file.ext and +++ b/path/to/file.ext
6. Each hunk header must follow the format: @@ -start,count +start,count @@
7. Every line within a hunk MUST start with one of these characters:
   - '+' for added lines
   - '-' for removed lines
   - ' ' (space) for context lines
8. Do not include any lines without these prefixes within a hunk
9. Ensure there are no trailing spaces or empty lines at the end of the diff

## CRITICAL: Ensuring Valid Diff Format

When creating diffs, ensure they are valid and can be parsed correctly:

1. **EXACT Line Counts - MOST CRITICAL**: In hunk headers like `@@ -1,14 +1,24 @@`:

   - Count ALL lines in the hunk PRECISELY - this is the most common cause of patch failures
   - First number pair `-1,14`: Must be EXACTLY the line number and count of original lines
   - Second number pair `+1,24`: Must be EXACTLY the line number and count of new lines
   - Formula for original count: (context lines + deleted lines)
   - Formula for new count: (context lines + added lines)
   - MANUALLY verify these counts before including the diff

2. **Sufficient Context Lines**:

   - Include at least 3 UNCHANGED context lines before and after your changes
   - Use MORE context lines for complex files or functions (5-7 lines)
   - If modifying function parameters or arguments, include the ENTIRE function signature

3. **Function-Based Changes**:

   - When adding code to functions, target EXACT positions within the function
   - Include the function signature and enough context to UNIQUELY identify the location
   - For API calls, include the COMPLETE API call method with all its parameters

4. **Multiple Hunks**:
   - For changes in different parts of the same file, use SEPARATE hunks
   - Each hunk must have its own header with PRECISE line numbers and counts
   - Ensure NO overlap between hunks

Example of a valid diff hunk with EXACT line counts:

```diff
@@ -10,7 +10,9 @@ function exampleFunction(param1, param2) {
   // This is a context line
   // Another context line
   // Third context line
-  const result = api.call(param1);
+  const result = api.call(param1, {
+    headers: { "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}` }
+  });
   // Context line after change
   // Another context line after
   // Third context line after
```

ALWAYS verify your line counts match EXACTLY the number of lines in each hunk before submitting.
