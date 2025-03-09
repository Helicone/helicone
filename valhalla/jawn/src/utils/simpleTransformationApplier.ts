import { promises as fs } from "fs";
import path from "path";
import { diff_match_patch } from "diff-match-patch";

/**
 * Represents a simple text replacement transformation
 */
export interface SimpleTransformation {
  // The file path to modify
  file: string;
  // Indicates if this is a new file to create
  isNewFile?: boolean;
  // The text to replace (for existing files)
  from?: string;
  // The new text to insert
  to: string;
}

/**
 * Maximum chunk size for safely searching through file content
 * This helps avoid the "Pattern too long for this browser" error
 */
const MAX_CHUNK_SIZE = 400; // Conservative limit based on observed errors

/**
 * Maximum pattern length for safely using diff-match-patch
 * This is based on the Match_MaxBits limitation in diff-match-patch
 */
const MAX_PATTERN_LENGTH = 32; // Match_MaxBits default is 32 in diff-match-patch

/**
 * Finds text in a file by searching through manageable chunks
 * If the pattern is too long, it will be chunked as well
 *
 * @param needle The text to find
 * @param haystack The file content to search through
 * @returns The index of the match, or -1 if not found
 */
function findTextInChunks(needle: string, haystack: string): number {
  console.log(
    `Searching for text (${needle.length} chars) in file content (${haystack.length} chars) using chunking`
  );

  // Create diff-match-patch instance
  const dmp = new diff_match_patch();
  dmp.Match_Threshold = 0.7;
  dmp.Match_Distance = 1000;

  // Check if we need to chunk the pattern
  const needleNeedsChunking = needle.length > MAX_PATTERN_LENGTH;

  if (needleNeedsChunking) {
    console.log(
      `Pattern length (${needle.length}) exceeds maximum safe length for diff-match-patch (${MAX_PATTERN_LENGTH}), will use pattern chunking`
    );

    // Try direct string search first as it's faster
    const directIndex = haystack.indexOf(needle);
    if (directIndex !== -1) {
      console.log(
        `Found exact match at position ${directIndex} using direct string search`
      );
      return directIndex;
    }

    console.log(`No exact match found, trying with pattern chunking`);
  } else {
    console.log(
      `Pattern length (${needle.length}) is within safe limits, using diff-match-patch directly`
    );
  }

  // If the haystack is small enough, search it directly
  if (haystack.length <= MAX_CHUNK_SIZE) {
    console.log(`File content is small enough for direct search`);

    if (!needleNeedsChunking) {
      try {
        const matchIndex = dmp.match_main(haystack, needle, 0);
        if (matchIndex !== -1) {
          console.log(
            `Found match at position ${matchIndex} using diff-match-patch`
          );
          return matchIndex;
        }
      } catch (error) {
        console.log(
          `Error in diff-match-patch: ${error}, falling back to direct search`
        );
        return haystack.indexOf(needle);
      }
    }

    // If we're here, either the pattern needs chunking or diff-match-patch didn't find a match
    return -1;
  }

  // Calculate a good overlap size to ensure we don't miss matches that cross chunk boundaries
  const overlapSize = Math.min(needle.length * 2, MAX_CHUNK_SIZE / 2);
  console.log(`Using chunk size ${MAX_CHUNK_SIZE} with overlap ${overlapSize}`);

  // Process the file in chunks with overlap
  for (let i = 0; i < haystack.length; i += MAX_CHUNK_SIZE - overlapSize) {
    const chunkEnd = Math.min(i + MAX_CHUNK_SIZE, haystack.length);
    const chunk = haystack.substring(i, chunkEnd);

    if (!needleNeedsChunking) {
      // If pattern is small enough, use diff-match-patch directly
      console.log(
        `Searching chunk ${i}-${chunkEnd} (${chunk.length} chars) with diff-match-patch`
      );

      try {
        const localIndex = dmp.match_main(chunk, needle, 0);
        if (localIndex !== -1) {
          const globalIndex = i + localIndex;
          console.log(
            `Found match at position ${globalIndex} using diff-match-patch`
          );
          return globalIndex;
        }
      } catch (error) {
        console.log(
          `Error in diff-match-patch: ${error}, trying direct search for this chunk`
        );
        const localIndex = chunk.indexOf(needle);
        if (localIndex !== -1) {
          const globalIndex = i + localIndex;
          console.log(
            `Found match at position ${globalIndex} using direct search`
          );
          return globalIndex;
        }
      }
    } else {
      // If pattern is too long, chunk it and verify matches
      console.log(
        `Searching chunk ${i}-${chunkEnd} (${chunk.length} chars) with pattern chunking`
      );

      // First try direct search as it's faster
      const localIndex = chunk.indexOf(needle);
      if (localIndex !== -1) {
        const globalIndex = i + localIndex;
        console.log(
          `Found exact match at position ${globalIndex} using direct search`
        );
        return globalIndex;
      }

      // If direct search fails, try chunking the pattern
      // We'll use the beginning and end of the pattern as anchors
      const needleStart = needle.substring(0, MAX_PATTERN_LENGTH / 2);
      const needleEnd = needle.substring(
        needle.length - MAX_PATTERN_LENGTH / 2
      );

      console.log(
        `Trying to match pattern start (${needleStart.length} chars) and end (${needleEnd.length} chars)`
      );

      try {
        // Find the start of the pattern
        const startIndex = dmp.match_main(chunk, needleStart, 0);
        if (startIndex !== -1) {
          // If we found the start, look for the end at an appropriate distance
          const expectedEndPos = startIndex + needle.length - needleEnd.length;
          const searchWindow = 20; // Allow some flexibility in the middle

          const endSearchStart = Math.max(0, expectedEndPos - searchWindow);
          const endSearchEnd = Math.min(
            chunk.length,
            expectedEndPos + searchWindow
          );
          const endSearchArea = chunk.substring(endSearchStart, endSearchEnd);

          const endLocalIndex = dmp.match_main(endSearchArea, needleEnd, 0);

          if (endLocalIndex !== -1) {
            const endIndex = endSearchStart + endLocalIndex;

            // Verify the match by checking the total length
            const matchedLength = endIndex + needleEnd.length - startIndex;
            const lengthDiff = Math.abs(matchedLength - needle.length);

            if (lengthDiff <= 10) {
              // Allow some flexibility
              // Extract the matched text and verify it's similar to our needle
              const matchedText = chunk.substring(
                startIndex,
                endIndex + needleEnd.length
              );

              // Simple similarity check - at least 80% of characters should match
              let matchCount = 0;
              const minLength = Math.min(matchedText.length, needle.length);

              for (let j = 0; j < minLength; j++) {
                if (matchedText[j] === needle[j]) {
                  matchCount++;
                }
              }

              const similarity = matchCount / minLength;

              if (similarity >= 0.8) {
                const globalIndex = i + startIndex;
                console.log(
                  `Found fuzzy match at position ${globalIndex} using pattern chunking (similarity: ${similarity.toFixed(
                    2
                  )})`
                );
                return globalIndex;
              }
            }
          }
        }
      } catch (error) {
        console.log(`Error in pattern chunking: ${error}`);
      }
    }
  }

  console.log(`No match found in any chunk`);
  return -1;
}

/**
 * Extracts simple text transformations from a Greptile response
 *
 * @param greptileResponse The response from Greptile containing transformations
 * @returns An array of SimpleTransformation objects
 */
export function extractSimpleTransformations(
  greptileResponse: any
): SimpleTransformation[] {
  try {
    // Extract the content from the response
    const responseContent =
      typeof greptileResponse === "string"
        ? greptileResponse
        : greptileResponse?.message || greptileResponse?.messages?.[0]?.content;

    if (!responseContent) {
      console.error("No content found in Greptile response");
      return [];
    }

    // Find JSON blocks in the response
    const jsonPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
    const matches = [...responseContent.matchAll(jsonPattern)];

    if (matches.length === 0) {
      console.error("No JSON blocks found in Greptile response");
      return [];
    }

    const transformations: SimpleTransformation[] = [];

    // Process each JSON block
    for (const match of matches) {
      try {
        const jsonContent = match[1];
        const parsedJson = JSON.parse(jsonContent);

        // Handle the case where the JSON represents a single file transformation
        if (parsedJson.file) {
          if (parsedJson.isNewFile || parsedJson.content) {
            transformations.push({
              file: parsedJson.file,
              isNewFile: true,
              to: parsedJson.content,
            });
          } else if (parsedJson.replacements) {
            // Process replacements for existing files
            for (const replacement of parsedJson.replacements) {
              transformations.push({
                file: parsedJson.file,
                from: replacement.from,
                to: replacement.to,
              });
            }
          }
        }
        // Handle the case where the JSON is an array of transformations
        else if (Array.isArray(parsedJson)) {
          for (const item of parsedJson) {
            if (item.file) {
              if (item.isNewFile || item.content) {
                transformations.push({
                  file: item.file,
                  isNewFile: true,
                  to: item.content,
                });
              } else if (item.replacements) {
                for (const replacement of item.replacements) {
                  transformations.push({
                    file: item.file,
                    from: replacement.from,
                    to: replacement.to,
                  });
                }
              }
            }
          }
        }
      } catch (jsonError) {
        console.error("Error parsing JSON block:", jsonError);
      }
    }

    console.log(`Extracted ${transformations.length} transformations`);
    return transformations;
  } catch (error) {
    console.error("Error extracting transformations:", error);
    return [];
  }
}

/**
 * Applies simple text transformations to files
 *
 * @param transformations Array of SimpleTransformation objects
 * @param repoPath The path to the repository root
 * @returns Object containing results of the transformation process
 */
export async function applySimpleTransformations(
  transformations: SimpleTransformation[],
  repoPath: string
): Promise<{
  successful: number;
  failed: number;
  errors: { file: string; error: string }[];
}> {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as { file: string; error: string }[],
  };

  console.log(`Starting to apply ${transformations.length} transformations`);

  for (const transformation of transformations) {
    try {
      console.log(
        `\n--- Processing transformation for ${transformation.file} ---`
      );

      const filePath = path.join(repoPath, transformation.file);
      console.log(`Full file path: ${filePath}`);

      // Ensure the directory exists
      const directory = path.dirname(filePath);
      await fs.mkdir(directory, { recursive: true });
      console.log(`Ensured directory exists: ${directory}`);

      if (transformation.isNewFile) {
        // Create new file
        console.log(
          `Creating new file with ${transformation.to.length} characters`
        );
        await fs.writeFile(filePath, transformation.to);
        console.log(`Created new file: ${transformation.file}`);
        results.successful++;
      } else {
        // Modify existing file
        if (!transformation.from) {
          console.log(`Error: Missing "from" field for text replacement`);
          throw new Error('Missing "from" field for text replacement');
        }

        console.log(
          `'from' text length: ${transformation.from.length} characters`
        );
        console.log(`'to' text length: ${transformation.to.length} characters`);
        console.log(
          `First 50 chars of 'from': ${transformation.from.substring(0, 50)}...`
        );

        let fileContent = "";
        try {
          fileContent = await fs.readFile(filePath, "utf8");
          console.log(
            `Read file ${transformation.file}, size: ${fileContent.length} characters`
          );
        } catch (readError: unknown) {
          const errorMessage =
            readError instanceof Error ? readError.message : String(readError);
          console.log(`Error reading file: ${errorMessage}`);
          throw new Error(`Cannot read file: ${errorMessage}`);
        }

        // Find the text to replace using our chunking approach
        console.log(`Searching for text to replace using chunking approach`);
        const matchIndex = findTextInChunks(transformation.from, fileContent);

        if (matchIndex === -1) {
          // If no match found, try with normalized whitespace
          console.log(
            `No exact match found, trying with normalized whitespace`
          );

          const normalizedFrom = transformation.from
            .replace(/\r\n/g, "\n")
            .replace(/[ \t]+/g, " ")
            .trim();

          const normalizedContent = fileContent
            .replace(/\r\n/g, "\n")
            .replace(/[ \t]+/g, " ")
            .trim();

          const hasNormalizedMatch = normalizedContent.includes(normalizedFrom);

          // Provide a helpful error message
          const fromPreview =
            transformation.from.substring(0, 50) +
            (transformation.from.length > 50 ? "..." : "");

          throw new Error(
            `Could not find the text to replace. Text starts with: "${fromPreview}"${
              hasNormalizedMatch
                ? ". A normalized version of this text exists in the file, but exact line breaks or whitespace differ."
                : ""
            }`
          );
        }

        // Replace the text
        console.log(
          `Found match at position ${matchIndex}, applying replacement`
        );
        const newContent =
          fileContent.substring(0, matchIndex) +
          transformation.to +
          fileContent.substring(matchIndex + transformation.from.length);

        await fs.writeFile(filePath, newContent);
        console.log(`Modified file: ${transformation.file}`);
        results.successful++;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Error applying transformation to ${transformation.file}:`,
        error
      );
      results.failed++;
      results.errors.push({
        file: transformation.file,
        error: errorMessage,
      });
    }
  }

  console.log(
    `\nTransformation results: ${results.successful} successful, ${results.failed} failed`
  );
  return results;
}
