export const replaceVariablesWithTags = (content: string): string => {
  const regex = /\{\{([^}]+)\}\}/g;
  return content.replace(
    regex,
    (match, p1) => `<helicone-prompt-input key="${p1.trim()}" />`
  );
};

export const replaceTagsWithVariables = (content: string): string => {
  const regex = /<helicone-prompt-input key="([^"]+)"[^>]*\/>/g;
  return content.replace(regex, (match, p1) => `{{${p1}}}`);
};
