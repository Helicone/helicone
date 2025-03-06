import React from "react";
import {
  FilterExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
} from "../../../../../services/lib/filters/filterAst";
import { FilterNodeProps } from "../types";
import { ConditionNode } from "./ConditionNode";
import { GroupNode } from "./GroupNode";
import { DraggableItem } from "./DraggableItem";

export const FilterNode: React.FC<FilterNodeProps> = ({
  node,
  path,
  isRoot = false,
  onUpdate,
  onAddCondition,
  onTransformToGroup,
  onDeleteNode,
  onChangeGroupType,
  onMoveItem,
  index,
}) => {
  if (node.type === "condition") {
    const conditionNode = node as ConditionExpression;
    // Check if we're at root or first level (path.length <= 1)
    const showTransformButton = path.length <= 1;

    return (
      <DraggableItem
        id={`condition-${path.join("-")}`}
        index={index}
        path={path}
        moveItem={onMoveItem}
        isRoot={isRoot}
      >
        <ConditionNode
          node={conditionNode}
          path={path}
          isRoot={isRoot}
          showTransformButton={showTransformButton}
          onUpdate={(field, value) => {
            const updatedNode = { ...conditionNode };
            if (field === "field") {
              updatedNode.field = value;
            } else {
              updatedNode[field] = value;
            }
            onUpdate(path, updatedNode);
          }}
          onTransform={() => onTransformToGroup(path, "and")}
          onDelete={() => onDeleteNode(path)}
        />
      </DraggableItem>
    );
  }

  if (node.type === "and" || node.type === "or") {
    const groupNode = node as AndExpression | OrExpression;
    // Check if this is a direct child of the root
    const isDirectChildOfRoot = path.length === 1;

    return (
      <DraggableItem
        id={`group-${path.join("-")}`}
        index={index}
        path={path}
        moveItem={onMoveItem}
        isRoot={isRoot}
      >
        <GroupNode
          node={node}
          path={path}
          isRoot={isRoot}
          isDirectChildOfRoot={isDirectChildOfRoot}
          onChangeType={(newType) => onChangeGroupType(path, newType)}
          onAddCondition={() => onAddCondition(path)}
          onAddGroup={(type) => {
            // Add a new group to this group
            const newPath = [...path];
            const groupNode = {
              type,
              expressions: [
                {
                  type: "condition",
                  field: {
                    table: "request_response_rmt",
                    column: "response_id",
                  },
                  operator: "eq",
                  value: "",
                },
              ],
            } as FilterExpression;
            onUpdate(newPath, {
              ...node,
              expressions: [
                ...(node as AndExpression | OrExpression).expressions,
                groupNode,
              ],
            });
          }}
          onDelete={() => onDeleteNode(path)}
        >
          {groupNode.expressions.map((child, childIndex) => (
            <FilterNode
              key={childIndex}
              node={child}
              path={[...path, childIndex]}
              index={childIndex}
              onUpdate={onUpdate}
              onAddCondition={onAddCondition}
              onTransformToGroup={onTransformToGroup}
              onDeleteNode={onDeleteNode}
              onChangeGroupType={onChangeGroupType}
              onMoveItem={onMoveItem}
            />
          ))}
        </GroupNode>
      </DraggableItem>
    );
  }

  return null;
};
