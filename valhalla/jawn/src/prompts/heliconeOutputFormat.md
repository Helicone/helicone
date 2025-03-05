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

## Important: Ensuring Valid Diff Format

When creating diffs, ensure they are valid and can be parsed correctly:

1. **Accurate Line Counts**: In hunk headers like `@@ -1,14 +1,24 @@`, ensure the line counts match the actual number of lines in the diff:

   - The first number pair `-1,14` means "starting at line 1, 14 lines from the original file"
   - The second number pair `+1,24` means "starting at line 1, 24 lines in the new file"
   - These counts must include ALL lines (context lines, removed lines, and added lines)

2. **Context Lines**: Include sufficient context lines (lines without + or - prefixes) to help with applying the diff

3. **Line Prefixes**:
   - Use a space for context lines (unchanged lines)
   - Use + for added lines
   - Use - for removed lines

Example of a valid diff hunk:

```diff
@@ -1,5 +1,7 @@
 // This is a context line
-// This line will be removed
+// This line was added
+// This is another added line
 // Another context line
 // More context
 // Final context line
```
