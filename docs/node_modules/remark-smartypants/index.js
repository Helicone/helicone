/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('retext-smartypants').Options} Options
 */

import { retext } from "retext";
import { visit } from "unist-util-visit";
import smartypants from "retext-smartypants";

/**
 * remark plugin to implement SmartyPants.
 *
 * @type {import('unified').Plugin<[Options?] | void[], Root>}
 */
export default function remarkSmartypants(options) {
  const processor = retext().use(smartypants, {
    ...options,
    // Do not replace ellipses, dashes, backticks because they change string
    // length, and we couldn't guarantee right splice of text in second visit of
    // tree
    ellipses: false,
    dashes: false,
    backticks: false,
  });

  const processor2 = retext().use(smartypants, {
    ...options,
    // Do not replace quotes because they are already replaced in the first
    // processor
    quotes: false,
  });

  return (tree) => {
    let allText = "";
    let startIndex = 0;
    const nodes = [];

    visit(tree, ["text", "inlineCode"], (node) => {
      allText +=
        node.type === "text" ? node.value : "A".repeat(node.value.length);
      nodes.push(node);
    });

    // Concat all text into one string, to properly replace quotes around links
    // and bold text
    allText = processor.processSync(allText).value;

    for (const node of nodes) {
      const endIndex = startIndex + node.value.length;
      if (node.type === "text") {
        const processedText = allText.slice(startIndex, endIndex);
        node.value = processor2.processSync(processedText).value;
      }
      startIndex = endIndex;
    }
  };
}
