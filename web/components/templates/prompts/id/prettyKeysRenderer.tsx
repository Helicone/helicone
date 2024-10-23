// File: web/components/templates/prompts/id/RenderWithPrettyInputKeys.tsx

import React from "react";

interface RenderWithPrettyInputKeysProps {
  text: string;
  selectedProperties: Record<string, string> | undefined;
}

const RenderWithPrettyInputKeys: React.FC<RenderWithPrettyInputKeysProps> = ({
  text,
  selectedProperties,
}) => {
  const replaceInputKeysWithComponents = (inputText: string) => {
    if (typeof inputText !== "string") {
      return JSON.stringify(inputText || "");
    }

    // Regular expression to match the variable placeholders
    const regex =
      /(?:\{\{([^}]+)\}\})|(?:<helicone-prompt-input key="([^"]+)"\s*\/>)/g;

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    inputText.replace(
      regex,
      (match: string, key1: string, key2: string, offset: number) => {
        const keyName = key1 || key2;

        // Push preceding text if any
        if (offset > lastIndex) {
          parts.push(inputText.substring(lastIndex, offset));
        }

        // Replace variable with value or placeholder
        const value = selectedProperties?.[keyName.trim()] || `{{${keyName}}}`;
        parts.push(
          <span
            key={offset}
            className="text-sky-500 dark:text-sky-500 bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-700 rounded-lg py-1 px-3 text-sm inline-block"
          >
            {value}
          </span>
        );

        // Update lastIndex to the end of the current match
        lastIndex = offset + match.length;

        return match;
      }
    );

    // Add any remaining text after the last match
    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className="text-md leading-8 text-black dark:text-white whitespace-pre-wrap">
      {replaceInputKeysWithComponents(text)}
    </div>
  );
};

export default RenderWithPrettyInputKeys;
