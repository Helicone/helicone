import { Variable } from "@/types/prompt-state";

export function extractVariables(
  content: string,
  validateNames: boolean = false
): { name: string; isValid?: boolean }[] {
  const matches = content.match(/{{\s*([^}]*)\s*}}/g) || [];
  return matches.map(match => {
    const varContent = match.slice(2, -2);
    const hasInvalidSpacing =
      varContent.startsWith(" ") || varContent.endsWith(" ");
    const name = varContent.trim();
    return validateNames
      ? {
          name,
          isValid: !hasInvalidSpacing && isValidVariableName(name),
        }
      : { name };
  });
}

// Helper function to get just variable names
export function extractAnyVariables(text: string): string[] {
  return extractVariables(text).map(v => v.name);
}

export function deduplicateVariables(variables: Variable[]): Variable[] {
  const uniqueVars = new Map<string, Variable>();
  variables.forEach(variable => {
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
  variables: Variable[]
): { isValid: boolean; hasValue: boolean; value?: string } {
  const variable = variables.find(v => v.name === varName);
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
  variables: Variable[]
): string {
  let result = content;
  (variables || [])
    .filter(v => v.isValid)
    .forEach(variable => {
      const pattern = new RegExp(`{{${variable.name}}}`, "g");
      result = result.replace(pattern, variable.value || `[${variable.name}]`);
    });
  return result;
}

export function isVariable(text: string): boolean {
  return text.startsWith("{{") && text.endsWith("}}") && text.length >= 4;
}
