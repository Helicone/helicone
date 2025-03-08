import React from "react";
import { FilterExpression } from "../../../../services/lib/filters/filterAst";
import { FilterASTEditorProps } from "./types";
import { FilterNode } from "./components/FilterNode";
import { DndProvider } from "./DndProvider";
import {
  addCondition,
  transformToGroup,
  deleteNode,
  updateNode,
  changeGroupType,
  createDefaultPropertyCondition,
  createDefaultScoreCondition,
} from "./utils";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";

/**
 * A component for editing filter expressions in AST format
 *
 * This component can be used in two ways:
 * 1. With props (filter, onChange) for controlled usage
 * 2. Without props, using the Zustand store for state management
 */
export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({
  filter,
  onChange,
  className,
}) => {
  // Get store methods if we're using the store
  const {
    currentFilter,
    updateNode: storeUpdateNode,
    addCondition: storeAddCondition,
    addPropertyCondition: storeAddPropertyCondition,
    addScoreCondition: storeAddScoreCondition,
    transformToGroup: storeTransformToGroup,
    deleteNode: storeDeleteNode,
    changeGroupType: storeChangeGroupType,
    moveItem: storeMoveItem,
  } = useFilterStore();

  // Determine if we're using props or store
  const usingStore = filter === undefined && onChange === undefined;
  const activeFilter = usingStore ? currentFilter : filter;

  // Handler for updating a node in the filter tree
  const handleUpdateNode = (
    path: number[],
    updatedNode: FilterExpression
  ): void => {
    if (usingStore) {
      storeUpdateNode(path, updatedNode);
    } else if (onChange) {
      onChange(updateNode(filter, path, updatedNode));
    }
  };

  // Handler for adding a condition to a group
  const handleAddCondition = (path: number[]): void => {
    if (usingStore) {
      storeAddCondition(path);
    } else if (onChange) {
      onChange(addCondition(filter, path));
    }
  };

  // Handler for adding a property condition to a group
  const handleAddPropertyCondition = (path: number[]): void => {
    if (usingStore) {
      storeAddPropertyCondition(path);
    } else if (onChange) {
      if (path.length === 0) {
        // If we're at the root and it's not a group, convert to a group
        if (filter.type === "condition") {
          onChange({
            type: "and",
            expressions: [filter, createDefaultPropertyCondition()],
          });
        } else {
          // Otherwise just add to the existing group
          const newExpressions = [
            ...(filter as any).expressions,
            createDefaultPropertyCondition(),
          ];
          onChange({
            ...filter,
            expressions: newExpressions,
          });
        }
      } else {
        // Add to a nested group
        onChange(
          updateNode(filter, path, (node: any) => ({
            ...node,
            expressions: [
              ...node.expressions,
              createDefaultPropertyCondition(),
            ],
          }))
        );
      }
    }
  };

  // Handler for adding a score condition to a group
  const handleAddScoreCondition = (path: number[]): void => {
    if (usingStore) {
      storeAddScoreCondition(path);
    } else if (onChange) {
      if (path.length === 0) {
        // If we're at the root and it's not a group, convert to a group
        if (filter.type === "condition") {
          onChange({
            type: "and",
            expressions: [filter, createDefaultScoreCondition()],
          });
        } else {
          // Otherwise just add to the existing group
          const newExpressions = [
            ...(filter as any).expressions,
            createDefaultScoreCondition(),
          ];
          onChange({
            ...filter,
            expressions: newExpressions,
          });
        }
      } else {
        // Add to a nested group
        onChange(
          updateNode(filter, path, (node: any) => ({
            ...node,
            expressions: [...node.expressions, createDefaultScoreCondition()],
          }))
        );
      }
    }
  };

  // Handler for transforming a condition to a group
  const handleTransformToGroup = (path: number[], type: "and" | "or"): void => {
    if (usingStore) {
      storeTransformToGroup(path, type);
    } else if (onChange) {
      onChange(transformToGroup(filter, path, type));
    }
  };

  // Handler for deleting a node
  const handleDeleteNode = (path: number[]): void => {
    if (usingStore) {
      storeDeleteNode(path);
    } else if (onChange) {
      onChange(deleteNode(filter, path));
    }
  };

  // Handler for changing a group type (AND/OR)
  const handleChangeGroupType = (
    path: number[],
    newType: "and" | "or"
  ): void => {
    if (usingStore) {
      storeChangeGroupType(path, newType);
    } else if (onChange) {
      onChange(changeGroupType(filter, path, newType));
    }
  };

  // Handler for moving items (drag and drop)
  const handleMoveItem = (
    dragIndex: number,
    hoverIndex: number,
    dragPath: number[],
    hoverPath: number[]
  ): void => {
    if (usingStore) {
      storeMoveItem(dragIndex, hoverIndex, dragPath, hoverPath);
    } else if (onChange) {
      // Only handle reordering within the same parent for now
      if (
        dragPath.length !== hoverPath.length ||
        dragPath.slice(0, -1).join(".") !== hoverPath.slice(0, -1).join(".")
      ) {
        return;
      }

      const parentPath = dragPath.slice(0, -1);

      // Get the parent node
      let parentNode;
      if (parentPath.length === 0) {
        parentNode = filter;
      } else {
        const getNodeAtPath = (node: any, path: number[], index = 0): any => {
          if (index >= path.length) return node;
          return getNodeAtPath(node.expressions[path[index]], path, index + 1);
        };
        parentNode = getNodeAtPath(filter, parentPath);
      }

      if (!parentNode || !parentNode.expressions) return;

      // Create a new array with the reordered items
      const newExpressions = [...parentNode.expressions];
      const [movedItem] = newExpressions.splice(dragIndex, 1);
      newExpressions.splice(hoverIndex, 0, movedItem);

      // Update the parent node with the new expressions array
      if (parentPath.length === 0) {
        onChange({ ...filter, expressions: newExpressions });
      } else {
        onChange(
          updateNode(filter, parentPath, (node: any) => ({
            ...node,
            expressions: newExpressions,
          }))
        );
      }
    }
  };

  // If we don't have a filter, don't render anything
  if (!activeFilter) {
    return null;
  }

  // Render the filter editor
  return (
    <div className={`space-y-4 ${className || ""}`}>
      <DndProvider>
        <FilterNode
          node={activeFilter}
          path={[]}
          index={0}
          isRoot={true}
          onUpdate={handleUpdateNode}
          onAddCondition={handleAddCondition}
          onTransformToGroup={handleTransformToGroup}
          onDeleteNode={handleDeleteNode}
          onChangeGroupType={handleChangeGroupType}
          onMoveItem={handleMoveItem}
        />
      </DndProvider>

      {/* Root level actions */}
      <div className="flex space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddCondition([])}
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Condition
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddPropertyCondition([])}
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Property Condition
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddScoreCondition([])}
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Score Condition
        </Button>
      </div>
    </div>
  );
};

export default FilterASTEditor;
