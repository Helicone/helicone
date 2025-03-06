import React from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroupNodeProps } from "../types";
import {
  AndExpression,
  OrExpression,
} from "../../../../../services/lib/filters/filterAst";

export const GroupNode: React.FC<GroupNodeProps> = ({
  node,
  path,
  isRoot = false,
  isDirectChildOfRoot,
  onChangeType,
  onAddCondition,
  onAddGroup,
  onDelete,
  children,
}) => {
  const groupNode = node as AndExpression | OrExpression;
  const type = groupNode.type;

  return (
    <div
      className={`rounded-md border border-border p-3 ${
        isRoot ? "bg-background" : "bg-card"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="outline"
          className={`cursor-pointer hover:opacity-80 transition-opacity ${
            type === "and"
              ? "bg-blue-100 hover:bg-blue-200"
              : "bg-amber-100 hover:bg-amber-200"
          }`}
          onClick={() => onChangeType(type === "and" ? "or" : "and")}
        >
          {type === "and" ? "AND" : "OR"}
        </Badge>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddCondition}
            className="h-8"
          >
            Add Condition
          </Button>

          {!isDirectChildOfRoot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddGroup("and")}
              className="h-8"
            >
              Add Group
            </Button>
          )}

          {!isRoot && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive"
              title="Delete group"
            >
              <Trash size={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 pl-4">{children}</div>
    </div>
  );
};
