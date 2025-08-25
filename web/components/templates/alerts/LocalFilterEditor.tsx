import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Filter, X, Code, ChevronDown, ChevronUp } from "lucide-react";
import { FilterExpression } from "@helicone-package/filters";
import { Small } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import LocalFilterBuilder from "./LocalFilterBuilder";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LocalFilterEditorProps {
  value: FilterExpression | null;
  onChange: (filter: FilterExpression | null) => void;
  placeholder?: string;
}

/**
 * Local filter editor that provides UI-based filter building
 * with JSON fallback for advanced users
 */
export const LocalFilterEditor: React.FC<LocalFilterEditorProps> = ({
  value,
  onChange,
  placeholder = "Add filter conditions",
}) => {
  const [showJson, setShowJson] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setFilterText(JSON.stringify(value, null, 2));
    } else {
      setFilterText("");
    }
  }, [value]);

  const handleJsonSave = () => {
    try {
      if (filterText.trim()) {
        const parsed = JSON.parse(filterText);
        onChange(parsed);
      } else {
        onChange(null);
      }
      setShowJson(false);
    } catch (e) {
      // Invalid JSON, don't save
      console.error("Invalid filter JSON:", e);
    }
  };

  const handleClear = () => {
    onChange(null);
    setFilterText("");
    setShowJson(false);
  };

  const getFilterSummary = (filter: FilterExpression): string => {
    if (!filter) return "";
    
    if (filter.type === "condition") {
      const condition = filter as any;
      const fieldName = condition.field?.column || "field";
      const operator = condition.operator === "eq" ? "=" : condition.operator;
      return `${fieldName} ${operator} ${condition.value}`;
    }
    
    if (filter.type === "and" || filter.type === "or") {
      const group = filter as any;
      const count = group.expressions?.length || 0;
      return `${count} condition${count !== 1 ? "s" : ""} (${filter.type.toUpperCase()})`;
    }
    
    return "Custom filter";
  };

  if (showJson) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowJson(false)}
          >
            ← Back to UI
          </Button>
          <Small className="text-muted-foreground">JSON Editor</Small>
        </div>
        
        <Textarea
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder='{"type": "condition", "field": {"table": "request_response_rmt", "column": "status"}, "operator": "eq", "value": 200}'
          className="font-mono text-xs"
          rows={8}
        />
        
        <div className="flex gap-2">
          <Button size="sm" onClick={handleJsonSave}>
            Apply Filter
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowJson(false)}>
            Cancel
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
        
        <Small className="text-muted-foreground">
          Advanced JSON editor for complex filters
        </Small>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 justify-between"
            >
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                {value ? "Edit filter conditions" : placeholder}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          {value && !isOpen && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="ml-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <CollapsibleContent className="mt-3 overflow-visible data-[state=open]:overflow-visible">
          <div className="border rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Conditions</h4>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowJson(true);
                  setIsOpen(false);
                }}
              >
                <Code className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </div>
            
            <LocalFilterBuilder
              value={value}
              onChange={onChange}
              onApply={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {value && !isOpen && (
        <Small className="text-muted-foreground pl-2">
          {getFilterSummary(value)}
        </Small>
      )}
    </div>
  );
};

export default LocalFilterEditor;