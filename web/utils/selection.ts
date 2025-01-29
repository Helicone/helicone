export type SelectionInfo = {
  selectionStart: number;
  selectionEnd: number;
};

export type SelectionRange = {
  range: Range;
  preRect: DOMRect;
};

export function createSelectionRange(
  pre: HTMLPreElement,
  selection: SelectionInfo,
): SelectionRange | null {
  // Create a range for the selection
  const range = document.createRange();
  let currentOffset = 0;
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startOffset = 0;
  let endOffset = 0;

  // Helper to process text content
  const processNode = (node: Node) => {
    const textNode =
      node.nodeType === Node.ELEMENT_NODE ? node.firstChild : node;
    if (!textNode) return false;

    const length = textNode.textContent?.length || 0;

    // Check if this node contains the start point
    if (
      startNode === null &&
      currentOffset + length >= selection.selectionStart
    ) {
      startNode = textNode;
      startOffset = selection.selectionStart - currentOffset;
    }

    // Check if this node contains the end point
    if (endNode === null && currentOffset + length >= selection.selectionEnd) {
      endNode = textNode;
      endOffset = selection.selectionEnd - currentOffset;
      return true; // Found both points
    }

    currentOffset += length;
    return false;
  };

  // Process all child nodes until we find our selection points
  for (const node of Array.from(pre.childNodes)) {
    if (processNode(node)) break;
  }

  // If we couldn't find the nodes, return null
  if (!startNode || !endNode) return null;

  try {
    // Set the range
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    return {
      range,
      preRect: pre.getBoundingClientRect(),
    };
  } catch (error) {
    console.error('Error setting range:', error);
    return null;
  }
}
