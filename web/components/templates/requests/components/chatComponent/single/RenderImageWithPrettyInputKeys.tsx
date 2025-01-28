export const RenderImageWithPrettyInputKeys = (props: {
  text: string;
  selectedProperties: Record<string, string> | undefined;
}) => {
  const { text, selectedProperties } = props;

  // Function to replace matched patterns with JSX components
  const replaceInputKeysWithComponents = (inputText: string) => {
    if (typeof inputText !== "string") {
      // don't throw, stringify the input and return it
      return JSON.stringify(inputText);
    }

    // Regular expression to match the pattern
    const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
    const parts = [];
    let lastIndex = 0;
    // Use the regular expression to find and replace all occurrences
    inputText.replace(regex, (match: any, keyName: string, offset: number) => {
      // Push preceding text if any
      if (offset > lastIndex) {
        parts.push(inputText.substring(lastIndex, offset));
      }

      const getRenderText = () => {
        if (selectedProperties) {
          return selectedProperties[keyName] || "{{undefined}}";
        } else {
          return keyName;
        }
      };
      const renderText = getRenderText();

      // eslint-disable-next-line @next/next/no-img-element
      parts.push(<img src={renderText} alt={keyName} className="max-h-24" />);

      // Update lastIndex to the end of the current match
      lastIndex = offset + match.length;

      // This return is not used but is necessary for the replace function
      return match;
    });

    // Add any remaining text after the last match
    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className="text-md leading-8 text-black dark:text-white">
      {replaceInputKeysWithComponents(text)}
    </div>
  );
};
