import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
  condition,
  propertyCondition,
  scoreCondition,
} from "../../../../services/lib/filters/filterAst";
import { ColumnType } from "./types";

/**
 * Get the input type based on the column
 */
export function getInputType(
  column: string
): "text" | "number" | "datetime" | "boolean" {
  if (
    column === "latency" ||
    column === "status" ||
    column === "completion_tokens" ||
    column === "prompt_tokens" ||
    column === "time_to_first_token" ||
    column === "scores"
  ) {
    return "number";
  } else if (
    column === "response_created_at" ||
    column === "request_created_at"
  ) {
    return "datetime";
  } else if (column === "is_cached") {
    return "boolean";
  }
  return "text";
}

/**
 * Create a default condition
 */
export function createDefaultCondition(): ConditionExpression {
  return condition("response_id", "eq", "");
}

/**
 * Create a default property condition
 */
export function createDefaultPropertyCondition(): ConditionExpression {
  return propertyCondition("user_id", "eq", "");
}

/**
 * Create a default score condition
 */
export function createDefaultScoreCondition(): ConditionExpression {
  return scoreCondition("toxicity", "gte", 0.5);
}

/**
 * Create a default group
 */
export function createDefaultGroup(
  type: "and" | "or"
): AndExpression | OrExpression {
  return {
    type,
    expressions: [createDefaultCondition()],
  } as AndExpression | OrExpression;
}

/**
 * Add a condition to a group
 */
export function addCondition(
  filter: FilterExpression,
  path: number[]
): FilterExpression {
  if (path.length === 0) {
    // If we're at the root and it's not a group, convert to a group
    if (filter.type === "condition") {
      return {
        type: "and",
        expressions: [filter, createDefaultCondition()],
      } as AndExpression;
    }

    // Otherwise add to the existing group
    if (filter.type === "and" || filter.type === "or") {
      return {
        ...filter,
        expressions: [
          ...(filter as AndExpression | OrExpression).expressions,
          createDefaultCondition(),
        ],
      };
    }
  }

  // Navigate to the target node and add the condition
  let current = filter;
  for (let i = 0; i < path.length; i++) {
    if (current.type !== "and" && current.type !== "or") break;
    current = (current as AndExpression | OrExpression).expressions[path[i]];
  }

  if (current.type !== "and" && current.type !== "or") {
    return filter;
  }

  const updatedNode = {
    ...current,
    expressions: [
      ...(current as AndExpression | OrExpression).expressions,
      createDefaultCondition(),
    ],
  };

  return updateNode(filter, path, updatedNode);
}

/**
 * Transform a condition into a group
 */
export function transformToGroup(
  filter: FilterExpression,
  path: number[],
  type: "and" | "or"
): FilterExpression {
  if (path.length === 0) {
    // If we're at the root, just return a new group with the condition
    if (filter.type === "condition") {
      return {
        type,
        expressions: [filter],
      } as AndExpression | OrExpression;
    }
    return filter;
  }

  // Get the parent node
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];

  let parentNode = filter;
  for (let i = 0; i < parentPath.length; i++) {
    if (parentNode.type !== "and" && parentNode.type !== "or") return filter;
    parentNode = (parentNode as AndExpression | OrExpression).expressions[
      parentPath[i]
    ];
  }

  if (parentNode.type !== "and" && parentNode.type !== "or") {
    return filter;
  }

  // Get the condition to transform
  const conditionNode = (parentNode as AndExpression | OrExpression)
    .expressions[index];
  if (conditionNode.type !== "condition") {
    return filter;
  }

  // Create a new group with the condition
  const newGroup = {
    type,
    expressions: [conditionNode],
  } as AndExpression | OrExpression;

  // Update the parent's expressions
  const newExpressions = [
    ...(parentNode as AndExpression | OrExpression).expressions,
  ];
  newExpressions[index] = newGroup;

  const updatedParentNode = {
    ...parentNode,
    expressions: newExpressions,
  };

  // Update the filter tree
  if (parentPath.length === 0) {
    return updatedParentNode as FilterExpression;
  } else {
    return updateNode(filter, parentPath, updatedParentNode);
  }
}

/**
 * Delete a node from the filter tree
 */
export function deleteNode(
  filter: FilterExpression,
  path: number[]
): FilterExpression {
  if (path.length === 0) {
    // If we're at the root, return a default condition
    return createDefaultCondition();
  }

  // Get the parent node
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];

  let parentNode = filter;
  for (let i = 0; i < parentPath.length; i++) {
    if (parentNode.type !== "and" && parentNode.type !== "or") return filter;
    parentNode = (parentNode as AndExpression | OrExpression).expressions[
      parentPath[i]
    ];
  }

  if (parentNode.type !== "and" && parentNode.type !== "or") {
    return filter;
  }

  // Create a new array of expressions without the deleted node
  const newExpressions = [
    ...(parentNode as AndExpression | OrExpression).expressions,
  ];
  newExpressions.splice(index, 1);

  // If there are no expressions left, replace with a default condition
  if (newExpressions.length === 0) {
    if (parentPath.length === 0) {
      return createDefaultCondition();
    }
    return updateNode(filter, parentPath, createDefaultCondition());
  }

  // If there's only one expression left and we're at the root, return just that expression
  if (newExpressions.length === 1 && parentPath.length === 0) {
    return newExpressions[0];
  }

  // Otherwise update the parent node
  const updatedParentNode = {
    ...parentNode,
    expressions: newExpressions,
  };

  // Update the filter tree
  if (parentPath.length === 0) {
    return updatedParentNode as FilterExpression;
  } else {
    return updateNode(filter, parentPath, updatedParentNode);
  }
}

/**
 * Update a node in the filter tree
 */
export function updateNode(
  filter: FilterExpression,
  path: number[],
  updatedNode: FilterExpression
): FilterExpression {
  if (path.length === 0) {
    return updatedNode;
  }

  // Navigate to the parent node
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];

  let parentNode = filter;
  for (let i = 0; i < parentPath.length; i++) {
    if (parentNode.type !== "and" && parentNode.type !== "or") return filter;
    parentNode = (parentNode as AndExpression | OrExpression).expressions[
      parentPath[i]
    ];
  }

  if (parentNode.type !== "and" && parentNode.type !== "or") {
    return filter;
  }

  // Update the parent's expressions
  const newExpressions = [
    ...(parentNode as AndExpression | OrExpression).expressions,
  ];
  newExpressions[index] = updatedNode;

  const updatedParentNode = {
    ...parentNode,
    expressions: newExpressions,
  };

  // Update the filter tree
  if (parentPath.length === 0) {
    return updatedParentNode as FilterExpression;
  } else {
    return updateNode(filter, parentPath, updatedParentNode);
  }
}

/**
 * Change a group's type
 */
export function changeGroupType(
  filter: FilterExpression,
  path: number[],
  newType: "and" | "or"
): FilterExpression {
  if (path.length === 0) {
    // If we're at the root, just change the type
    if (filter.type === "and" || filter.type === "or") {
      return {
        ...filter,
        type: newType,
      };
    }
    return filter;
  }

  // Navigate to the node
  let current = filter;
  let parentNode = filter;
  let index = 0;

  for (let i = 0; i < path.length; i++) {
    if (current.type !== "and" && current.type !== "or") return filter;
    if (i === path.length - 1) {
      parentNode = current;
      index = path[i];
    }
    current = (current as AndExpression | OrExpression).expressions[path[i]];
  }

  if (current.type !== "and" && current.type !== "or") {
    return filter;
  }

  // Change the type
  const updatedNode = {
    ...current,
    type: newType,
  };

  // Update the filter tree
  if (path.length === 1) {
    const newExpressions = [
      ...(parentNode as AndExpression | OrExpression).expressions,
    ];
    newExpressions[index] = updatedNode;
    return {
      ...parentNode,
      expressions: newExpressions,
    };
  } else {
    return updateNode(filter, path, updatedNode);
  }
}
