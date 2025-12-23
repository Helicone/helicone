export function numberWithCommas(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Converts single newlines to double newlines for proper markdown rendering.
 * Preserves existing double newlines (paragraph breaks) and code blocks.
 *
 * In standard markdown, single newlines are treated as spaces.
 * This function ensures line breaks are preserved when rendering with markdown renderers.
 *
 * @param text - The text to process
 * @returns The text with single newlines converted to double newlines (except in code blocks)
 */
export function preserveLineBreaksForMarkdown(text: string): string {
  // Split by code blocks to preserve formatting inside them
  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;
  const parts = text.split(codeBlockRegex);

  return parts
    .map((part, index) => {
      // Odd indices are code blocks, preserve them as-is
      if (index % 2 === 1) {
        return part;
      }
      // For non-code parts, convert single newlines to double newlines
      // but don't affect existing double newlines
      return part.replace(/\n(?!\n)/g, "\n\n");
    })
    .join("");
}
