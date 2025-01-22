import { camelCase, kebabCase, snakeCase } from "change-case-all";

// kebab-case
export const toKebabCase = (str: string) => {
  return kebabCase(str);
};

// snake_case
export const toSnakeCase = (str: string) => {
  return snakeCase(str);
};

// camelCase
export const toCamelCase = (str: string) => {
  return camelCase(str);
};
