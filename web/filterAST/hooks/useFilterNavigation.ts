import { useFilterStore } from "../store/filterStore";
import { FilterExpression, AndExpression, OrExpression } from "../filterAst";

/**
 * Custom hook for navigating and manipulating filter expressions
 * Provides utility functions for finding, getting, and updating expressions in the filter tree
 */
export const useFilterNavigation = () => {
  const filterStore = useFilterStore();

  /**
   * Get the node at the specified path
   */
  const getNodeAtPath = (path: number[]): FilterExpression | null => {
    if (!filterStore.filter) return null;

    let current = filterStore.filter;

    for (let i = 0; i < path.length; i++) {
      if (current.type !== "and" && current.type !== "or") return null;
      if (path[i] >= current.expressions.length) return null;
      current = current.expressions[path[i]];
    }

    return current;
  };

  /**
   * Check if the node at the specified path is a group (AND/OR)
   */
  const isGroupNode = (path: number[]): boolean => {
    const node = getNodeAtPath(path);
    return !!node && (node.type === "and" || node.type === "or");
  };

  /**
   * Check if the node at the specified path is a condition
   */
  const isConditionNode = (path: number[]): boolean => {
    const node = getNodeAtPath(path);
    return !!node && node.type === "condition";
  };

  /**
   * Get the parent path of a node
   */
  const getParentPath = (path: number[]): number[] => {
    return path.slice(0, -1);
  };

  /**
   * Get the parent node of a node at the specified path
   */
  const getParentNode = (
    path: number[]
  ): AndExpression | OrExpression | null => {
    if (path.length === 0) return null;

    const parentPath = getParentPath(path);
    const node = getNodeAtPath(parentPath);

    if (!node || (node.type !== "and" && node.type !== "or")) return null;

    return node as AndExpression | OrExpression;
  };

  /**
   * Get all paths to nodes that match a predicate function
   */
  const findNodePaths = (
    predicate: (node: FilterExpression) => boolean,
    startPath: number[] = [],
    startNode: FilterExpression | null = filterStore.filter
  ): number[][] => {
    if (!startNode) return [];

    const paths: number[][] = [];

    if (predicate(startNode)) {
      paths.push([...startPath]);
    }

    if (startNode.type === "and" || startNode.type === "or") {
      startNode.expressions.forEach((expr, index) => {
        const newPath = [...startPath, index];
        const nestedPaths = findNodePaths(predicate, newPath, expr);
        paths.push(...nestedPaths);
      });
    }

    return paths;
  };

  return {
    getNodeAtPath,
    isGroupNode,
    isConditionNode,
    getParentPath,
    getParentNode,
    findNodePaths,
  };
};

export default useFilterNavigation;
