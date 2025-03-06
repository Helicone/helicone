import React from "react";
import {
  FilterExpression,
  AndExpression,
  OrExpression,
} from "../../../../services/lib/filters/filterAst";
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

/**
 * A component for editing filter expressions in AST format
 */
export const FilterASTEditor: React.FC<FilterASTEditorProps> = ({
  filter,
  onChange,
  className,
}) => {
  // Handler for updating a node in the filter tree
  const handleUpdateNode = (
    path: number[],
    updatedNode: FilterExpression
  ): void => {
    onChange(updateNode(filter, path, updatedNode));
  };

  // Handler for adding a condition to a group
  const handleAddCondition = (path: number[]): void => {
    onChange(addCondition(filter, path));
  };

  // Handler for adding a property condition to a group
  const handleAddPropertyCondition = (path: number[]): void => {
    if (path.length === 0) {
      // If we're at the root and it's not a group, convert to a group
      if (filter.type === "condition") {
        onChange({
          type: "and",
          expressions: [filter, createDefaultPropertyCondition()],
        });
        return;
      }

      // Otherwise add to the existing group
      if (filter.type === "and" || filter.type === "or") {
        onChange({
          ...filter,
          expressions: [
            ...(filter as AndExpression | OrExpression).expressions,
            createDefaultPropertyCondition(),
          ],
        });
        return;
      }
    }

    // Navigate to the target node and add the condition
    let current = filter;
    for (let i = 0; i < path.length; i++) {
      if (current.type !== "and" && current.type !== "or") break;
      current = (current as AndExpression | OrExpression).expressions[path[i]];
    }

    if (current.type !== "and" && current.type !== "or") {
      return;
    }

    const updatedNode = {
      ...current,
      expressions: [
        ...(current as AndExpression | OrExpression).expressions,
        createDefaultPropertyCondition(),
      ],
    };

    onChange(updateNode(filter, path, updatedNode));
  };

  // Handler for adding a score condition to a group
  const handleAddScoreCondition = (path: number[]): void => {
    if (path.length === 0) {
      // If we're at the root and it's not a group, convert to a group
      if (filter.type === "condition") {
        onChange({
          type: "and",
          expressions: [filter, createDefaultScoreCondition()],
        });
        return;
      }

      // Otherwise add to the existing group
      if (filter.type === "and" || filter.type === "or") {
        onChange({
          ...filter,
          expressions: [
            ...(filter as AndExpression | OrExpression).expressions,
            createDefaultScoreCondition(),
          ],
        });
        return;
      }
    }

    // Navigate to the target node and add the condition
    let current = filter;
    for (let i = 0; i < path.length; i++) {
      if (current.type !== "and" && current.type !== "or") break;
      current = (current as AndExpression | OrExpression).expressions[path[i]];
    }

    if (current.type !== "and" && current.type !== "or") {
      return;
    }

    const updatedNode = {
      ...current,
      expressions: [
        ...(current as AndExpression | OrExpression).expressions,
        createDefaultScoreCondition(),
      ],
    };

    onChange(updateNode(filter, path, updatedNode));
  };

  // Handler for transforming a condition into a group
  const handleTransformToGroup = (path: number[], type: "and" | "or"): void => {
    onChange(transformToGroup(filter, path, type));
  };

  // Handler for deleting a node
  const handleDeleteNode = (path: number[]): void => {
    onChange(deleteNode(filter, path));
  };

  // Handler for changing a group's type
  const handleChangeGroupType = (
    path: number[],
    newType: "and" | "or"
  ): void => {
    onChange(changeGroupType(filter, path, newType));
  };

  // Handler for moving items (drag and drop)
  const handleMoveItem = (
    dragIndex: number,
    hoverIndex: number,
    dragPath: number[],
    hoverPath: number[]
  ): void => {
    // Only handle moves within the same parent
    if (dragPath.length !== hoverPath.length) {
      return;
    }

    // Check if paths have the same parent
    const dragParentPath = dragPath.slice(0, -1);
    const hoverParentPath = hoverPath.slice(0, -1);

    for (let i = 0; i < dragParentPath.length; i++) {
      if (dragParentPath[i] !== hoverParentPath[i]) {
        return;
      }
    }

    // Get the parent node
    let parentNode = filter;
    for (let i = 0; i < dragParentPath.length; i++) {
      if (parentNode.type !== "and" && parentNode.type !== "or") {
        return;
      }
      parentNode = (parentNode as AndExpression | OrExpression).expressions[
        dragParentPath[i]
      ];
    }

    if (parentNode.type !== "and" && parentNode.type !== "or") {
      return;
    }

    // Create a new array of expressions with the item moved
    const newExpressions = [
      ...(parentNode as AndExpression | OrExpression).expressions,
    ];
    const [movedItem] = newExpressions.splice(dragIndex, 1);
    newExpressions.splice(hoverIndex, 0, movedItem);

    // Create the updated parent node
    const updatedParentNode = {
      ...parentNode,
      expressions: newExpressions,
    };

    // Update the filter tree
    if (dragParentPath.length === 0) {
      onChange(updatedParentNode as FilterExpression);
    } else {
      onChange(updateNode(filter, dragParentPath, updatedParentNode));
    }
  };

  return (
    <DndProvider>
      <div className={className}>
        <FilterNode
          node={filter}
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

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddCondition([])}
            className="flex items-center"
          >
            <PlusIcon size={16} className="mr-2" /> Add Condition
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddPropertyCondition([])}
            className="flex items-center"
          >
            <PlusIcon size={16} className="mr-2" /> Add Property Filter
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddScoreCondition([])}
            className="flex items-center"
          >
            <PlusIcon size={16} className="mr-2" /> Add Score Filter
          </Button>
        </div>
      </div>
    </DndProvider>
  );
};

export default FilterASTEditor;
