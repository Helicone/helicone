/**
 * HQL AST Vocabulary Validator
 *
 * Walks the SQL AST from node-sql-parser and validates that only
 * whitelisted functions and operators are used.
 *
 * This provides defense-in-depth against SQL injection and unauthorized
 * function calls that could bypass row-level security.
 */

import { AST } from "node-sql-parser";
import { Result, ok } from "../../packages/common/result";
import { HqlError, HqlErrorCode, hqlError } from "../errors/HqlErrors";
import {
  isAllowedFunction,
  isAllowedOperator,
  isBlockedFunction,
} from "./hqlVocabulary";

/**
 * Validation error details
 */
export interface ValidationError {
  type: "function" | "operator" | "construct";
  name: string;
  reason?: string;
}

/**
 * Validate an AST against the HQL vocabulary whitelist.
 * Returns an error if any disallowed constructs are found.
 */
export function validateAstVocabulary(ast: AST): Result<null, HqlError> {
  const errors: ValidationError[] = [];
  walkNode(ast, errors);

  if (errors.length > 0) {
    const details = errors
      .map((e) => {
        const prefix =
          e.type === "function"
            ? "Function"
            : e.type === "operator"
              ? "Operator"
              : "Construct";
        const reason = e.reason ? ` (${e.reason})` : "";
        return `${prefix} '${e.name}' is not allowed${reason}`;
      })
      .join("; ");
    return hqlError(HqlErrorCode.INVALID_SQL_CONSTRUCT, details);
  }

  return ok(null);
}

/**
 * Recursively walk an AST node and collect validation errors.
 */
function walkNode(node: unknown, errors: ValidationError[]): void {
  if (!node || typeof node !== "object") {
    return;
  }

  // Handle arrays
  if (Array.isArray(node)) {
    for (const item of node) {
      walkNode(item, errors);
    }
    return;
  }

  const obj = node as Record<string, unknown>;

  // Check for function calls
  if (obj.type === "function" || obj.type === "aggr_func") {
    const funcName = extractFunctionName(obj);
    if (funcName) {
      validateFunction(funcName, errors);
    }
  }

  // Check for CASE expressions with aggregate functions
  if (obj.type === "case") {
    walkCaseExpression(obj, errors);
  }

  // Check for window functions (OVER clause)
  if (obj.over) {
    walkNode(obj.over, errors);
  }

  // Check for binary expressions (operators)
  if (obj.type === "binary_expr") {
    const operator = obj.operator as string;
    if (operator && !isAllowedOperator(operator)) {
      errors.push({ type: "operator", name: operator });
    }
  }

  // Check for unary expressions
  if (obj.type === "unary_expr") {
    const operator = obj.operator as string;
    if (operator) {
      const normalizedOp = operator.toLowerCase();
      if (
        normalizedOp !== "not" &&
        normalizedOp !== "-" &&
        normalizedOp !== "+"
      ) {
        errors.push({ type: "operator", name: operator });
      }
    }
  }

  // Check for subqueries - these are allowed but need validation too
  if (obj.ast && typeof obj.ast === "object") {
    walkNode(obj.ast, errors);
  }

  // Check for UNION/INTERSECT/EXCEPT constructs
  if (obj._next && typeof obj._next === "object") {
    walkNode(obj._next, errors);
  }

  // Block INSERT, UPDATE, DELETE statements that might be embedded
  if (
    obj.type === "insert" ||
    obj.type === "update" ||
    obj.type === "delete" ||
    obj.type === "create" ||
    obj.type === "drop" ||
    obj.type === "alter" ||
    obj.type === "truncate"
  ) {
    errors.push({
      type: "construct",
      name: String(obj.type).toUpperCase(),
      reason: "only SELECT statements are allowed",
    });
  }

  // Recursively walk all properties
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === "object") {
      walkNode(value, errors);
    }
  }
}

/**
 * Extract function name from a function AST node.
 */
function extractFunctionName(node: Record<string, unknown>): string | null {
  // Handle aggr_func type (COUNT, SUM, etc.)
  if (node.type === "aggr_func") {
    const name = node.name as string;
    return name || null;
  }

  // Handle function type
  if (node.type === "function") {
    const name = node.name as
      | string
      | { name: Array<{ value: string }> }
      | undefined;
    if (typeof name === "string") {
      return name;
    }
    // Handle compound names like JSONExtract
    if (name && typeof name === "object" && name.name && name.name[0]) {
      return name.name[0].value;
    }
  }

  return null;
}

/**
 * Validate a function name against the whitelist.
 */
function validateFunction(name: string, errors: ValidationError[]): void {
  const lowerName = name.toLowerCase();

  // Check explicitly blocked functions first
  if (isBlockedFunction(lowerName)) {
    errors.push({
      type: "function",
      name: name,
      reason: "security-blocked function",
    });
    return;
  }

  // Check if function is in the whitelist
  if (!isAllowedFunction(lowerName)) {
    errors.push({
      type: "function",
      name: name,
      reason: "not in allowed function list",
    });
  }
}

/**
 * Walk CASE expression nodes.
 */
function walkCaseExpression(
  node: Record<string, unknown>,
  errors: ValidationError[]
): void {
  // Walk the condition (expr)
  if (node.expr) {
    walkNode(node.expr, errors);
  }

  // Walk WHEN clauses
  const args = node.args as unknown[] | undefined;
  if (args && Array.isArray(args)) {
    for (const arg of args) {
      walkNode(arg, errors);
    }
  }

  // Walk ELSE clause
  if (node.result) {
    walkNode(node.result, errors);
  }
}

/**
 * Get a list of all functions found in an AST (for debugging/testing).
 */
export function extractAllFunctions(ast: AST): string[] {
  const functions: string[] = [];
  collectFunctions(ast, functions);
  return [...new Set(functions)];
}

function collectFunctions(node: unknown, functions: string[]): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectFunctions(item, functions);
    }
    return;
  }

  const obj = node as Record<string, unknown>;

  if (obj.type === "function" || obj.type === "aggr_func") {
    const name = extractFunctionName(obj);
    if (name) {
      functions.push(name.toLowerCase());
    }
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === "object") {
      collectFunctions(value, functions);
    }
  }
}

/**
 * Get a list of all operators found in an AST (for debugging/testing).
 */
export function extractAllOperators(ast: AST): string[] {
  const operators: string[] = [];
  collectOperators(ast, operators);
  return [...new Set(operators)];
}

function collectOperators(node: unknown, operators: string[]): void {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectOperators(item, operators);
    }
    return;
  }

  const obj = node as Record<string, unknown>;

  if (obj.type === "binary_expr" || obj.type === "unary_expr") {
    const operator = obj.operator as string;
    if (operator) {
      operators.push(operator.toLowerCase());
    }
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === "object") {
      collectOperators(value, operators);
    }
  }
}
