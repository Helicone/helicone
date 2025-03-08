import React, { useState, useRef, useEffect } from "react";
import { Trash } from "lucide-react";
import {
  ConditionNodeProps,
  COLUMNS,
  OPERATORS,
  COMMON_PROPERTIES,
  COMMON_SCORES,
} from "../types";
import { getInputType } from "../utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePropertyKeys } from "../hooks/usePropertyKeys";
import { useScoreKeys } from "../hooks/useScoreKeys";

export const ConditionNode: React.FC<ConditionNodeProps> = ({
  node,
  path,
  showTransformButton = false,
  onUpdate,
  onTransform,
  onDelete,
}) => {
  const [customKey, setCustomKey] = useState<string>("");
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const propertyKeysQuery = usePropertyKeys();
  const scoreKeysQuery = useScoreKeys();

  // Initialize customKey if condition has a key
  useEffect(() => {
    if (node.field.subtype && node.field.key) {
      setCustomKey(node.field.key);
    }
  }, [node.field.subtype, node.field.key]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingKey && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingKey]);

  const handleColumnChange = (value: string) => {
    const column = COLUMNS.find((col) => col.value === value);

    // Handle columns with subtypes
    if (column?.hasSubtypes) {
      if (value === "properties") {
        onUpdate("field", {
          ...node.field,
          column: value,
          subtype: "property",
          key: "user_id", // Default key for properties
          operator: "=",
          value: "",
        });
      } else if (value === "scores") {
        onUpdate("field", {
          ...node.field,
          column: value,
          subtype: "score",
          key: "toxicity", // Default key for scores
          operator: ">=",
          value: 0.5,
        });
      }
    } else {
      // For regular columns, remove subtype and key
      const { subtype, key, ...rest } = node.field;
      onUpdate("field", {
        ...rest,
        column: value,
        operator: OPERATORS[0].value,
        value: "",
      });
    }
  };

  const handleSubtypeKeyChange = (value: string) => {
    if (value === "custom") {
      setIsEditingKey(true);
      return;
    }

    onUpdate("field", {
      ...node.field,
      key: value,
    });
  };

  const handleCustomKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomKey(e.target.value);
  };

  const applyCustomKey = () => {
    if (customKey.trim()) {
      onUpdate("field", {
        ...node.field,
        key: customKey.trim(),
      });
    }
    setIsEditingKey(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyCustomKey();
    }
  };

  const handleOperatorChange = (value: string) => {
    onUpdate("operator", value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputType = getInputType(node.field.column);
    let value: string | number | boolean = e.target.value;

    if (inputType === "number") {
      value = e.target.value === "" ? 0 : Number(e.target.value);
    } else if (inputType === "boolean") {
      value = e.target.value === "true";
    }

    onUpdate("value", value);
  };

  const handleBooleanValueChange = (value: string) => {
    onUpdate("value", value === "true");
  };

  // Get the appropriate input type based on the column
  const inputType = getInputType(node.field.column);

  // Get the list of keys for the current subtype
  const getKeyOptions = () => {
    if (node.field.subtype === "property") {
      // Use API data if available, otherwise fallback to common properties
      if (propertyKeysQuery.isSuccess && propertyKeysQuery.data?.length > 0) {
        return propertyKeysQuery.data.map((item) => item.property);
      }
      return COMMON_PROPERTIES;
    } else if (node.field.subtype === "score") {
      // Use API data if available, otherwise fallback to common scores
      if (scoreKeysQuery.isSuccess && scoreKeysQuery.data?.length > 0) {
        return scoreKeysQuery.data.map((item) => item.score);
      }
      return COMMON_SCORES;
    }
    return [];
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 flex-grow">
        <Select value={node.field.column} onValueChange={handleColumnChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {COLUMNS.map((column) => (
              <SelectItem key={column.value} value={column.value}>
                {column.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {node.field.subtype && (
          <>
            {isEditingKey ? (
              <Input
                ref={inputRef}
                value={customKey}
                onChange={handleCustomKeyChange}
                onBlur={applyCustomKey}
                onKeyDown={handleKeyDown}
                className="w-[180px]"
                placeholder={`Enter ${node.field.subtype} key`}
              />
            ) : (
              <Select
                value={node.field.key || ""}
                onValueChange={handleSubtypeKeyChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder={`Select ${node.field.subtype} key`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {getKeyOptions().map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom key...</SelectItem>
                </SelectContent>
              </Select>
            )}
          </>
        )}

        <Select value={node.operator} onValueChange={handleOperatorChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((operator) => (
              <SelectItem key={operator.value} value={operator.value}>
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {inputType === "boolean" ? (
          <Select
            value={String(node.value)}
            onValueChange={handleBooleanValueChange}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={inputType}
            value={node.value?.toString() || ""}
            onChange={handleValueChange}
            className="w-[200px]"
            placeholder="Value"
          />
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onDelete}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete condition"
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
};
