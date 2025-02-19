import { StateVariable } from "@/types/prompt-state";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export function extractVariables(
  content: string,
  mode: "helicone" | "template"
): StateVariable[] {
  const regex =
    mode === "helicone"
      ? /<helicone-prompt-input key="([^"]+)"(?:[^>]*?)(?:>(.*?)<\/helicone-prompt-input>|\s*\/>)/g
      : /{{\s*([^}]*)\s*}}/g;

  const matches = Array.from(content.matchAll(regex));
  return matches.map((match) => ({
    name: match[1],
    value: match[2] || "",
    isValid: isValidVariableName(match[1]),
  }));
}

export function deduplicateVariables(variables: StateVariable[]): StateVariable[] {
  const uniqueVars = new Map<string, StateVariable>();
  variables.forEach((variable) => {
    if (!uniqueVars.has(variable.name)) {
      uniqueVars.set(variable.name, variable);
    }
  });
  return Array.from(uniqueVars.values());
}

export function isValidVariableName(varContent: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(varContent);
}

export function getVariableStatus(
  varName: string,
  variables: StateVariable[]
): { isValid: boolean; hasValue: boolean; value?: string } {
  const variable = variables.find((v) => v.name === varName);
  const hasValue = Boolean(variable?.value && variable.value.length > 0);
  const isValid = isValidVariableName(varName);

  return {
    isValid,
    hasValue,
    value: variable?.value,
  };
}

export function replaceVariables(
  content: string,
  variables: StateVariable[]
): string {
  let result = content;
  (variables || [])
    .filter((v) => v.isValid)
    .forEach((variable) => {
      const pattern = new RegExp(`{{${variable.name}}}`, "g");
      result = result.replace(pattern, variable.value || `[${variable.name}]`);
    });
  return result;
}

export function isVariable(text: string): boolean {
  return text.startsWith("{{") && text.endsWith("}}") && text.length >= 4;
}

/**
 * Converts {{variable}} syntax to helicone-prompt-input tags
 * @param content The string content containing {{variable}} syntax
 * @returns The string with variables converted to helicone tags
 */
export function templateToHeliconeTags(content: string): string {
  // This regex matches {{variable}} with optional whitespace inside the braces
  // It ensures we don't match nested braces and trims whitespace from variable names
  return content.replace(/{{\s*([^{}]+?)\s*}}/g, (_, varName) => {
    return `<helicone-prompt-input key="${varName.trim()}"/>`;
  });
}

/**
 * Converts helicone-prompt-input tags to {{variable}} syntax
 * @param content The string content containing helicone-prompt-input tags
 * @param inputs Optional map of input keys to their default values
 * @returns The string with helicone tags converted to variable syntax
 */
export function heliconeToTemplateTags(content: string): string {
  // Handle both self-closing and full tags
  const regex =
    /<helicone-prompt-input key="([^"]+)"[^>]*>([^<]*)<\/helicone-prompt-input>|<helicone-prompt-input key="([^"]+)"[^>]*\/>/g;
  return content.replace(regex, (match, key1, content1, key2) => {
    const varName = (key1 || key2).trim();
    return `{{${varName}}}`;
  });
}

/**
 * Unified function to convert a message's content to a string and handle variable replacement
 * Works with both string content and array content types
 */
export function processMessageContent(
  message: ChatCompletionMessageParam,
  options: {
    convertTags?: boolean;
    variables?: StateVariable[];
  } = {}
): string {
  const content = message.content;

  // Handle null/undefined content
  if (!content) return "";

  // Handle array content type
  if (Array.isArray(content)) {
    let textContent = "";
    for (const item of content) {
      if (
        typeof item === "object" &&
        item &&
        "type" in item &&
        item.type === "text" &&
        "text" in item
      ) {
        textContent = item.text;
        break;
      }
    }
    return processContent(textContent, {
      convertTags: options.convertTags,
      variables: options.variables,
    });
  }

  // Handle string content type
  return processContent(content, {
    convertTags: options.convertTags,
    variables: options.variables,
  });
}

/**
 * Helper function to process content string with optional variable replacement
 */
function processContent(
  content: string,
  options: {
    convertTags?: boolean;
    variables?: StateVariable[];
  } = {}
): string {
  // First convert helicone tags to variables if needed
  let processedContent = options.convertTags
    ? heliconeToTemplateTags(content)
    : content;

  // Then replace variables with their values if variables are provided
  if (options.variables) {
    processedContent = replaceVariables(processedContent, options.variables);
  }

  return processedContent;
}
