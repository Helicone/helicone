import React, { useState, useEffect } from "react";
import {
  FilterExpression,
  ConditionExpression,
} from "../../../../services/lib/filters/filterAst";
import { FilterASTEditor } from "./filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, X, Filter } from "lucide-react";
import { COLUMNS } from "./types";

interface FilterPillDropdownProps {
  filter?: FilterExpression;
  onChange?: (filter: FilterExpression) => void;
  className?: string;
  createNewFilter?: () => Promise<void>;
  isCreatingFilter?: boolean;
}

/**
 * Generates a simplified text representation of a filter
 */
const getFilterSummary = (filter: FilterExpression | null): string => {
  if (!filter) return "No filter";

  if (filter.type === "condition") {
    const condition = filter as ConditionExpression;
    const column = COLUMNS.find((col) => col.value === condition.field.column);
    const columnLabel = column?.label || condition.field.column;

    // For properties and scores, include the key
    if (condition.field.subtype && condition.field.key) {
      return `${columnLabel}: ${condition.field.key} ${condition.operator} ${condition.value}`;
    }

    return `${columnLabel} ${condition.operator} ${condition.value}`;
  }

  if (filter.type === "and" || filter.type === "or") {
    const expressions = filter.expressions || [];
    if (expressions.length === 0) return "Empty filter";

    // Get summaries for the first 2 conditions
    const summaries = expressions
      .slice(0, 2)
      .map((expr) => getFilterSummary(expr));

    // If there are more than 2 conditions, add an ellipsis
    const moreCount = expressions.length - 2;
    const summary = summaries.join(` ${filter.type.toUpperCase()} `);

    return moreCount > 0
      ? `${summary} ${filter.type.toUpperCase()} ${moreCount} more...`
      : summary;
  }

  return "Complex filter";
};

/**
 * Counts the number of conditions in a filter
 */
const countConditions = (filter: FilterExpression | null): number => {
  if (!filter) return 0;

  if (filter.type === "condition") {
    return 1;
  }

  if (filter.type === "and" || filter.type === "or") {
    return (filter.expressions || []).reduce(
      (sum, expr) => sum + countConditions(expr),
      0
    );
  }

  return 0;
};

export const FilterPillDropdown: React.FC<FilterPillDropdownProps> = ({
  filter,
  onChange,
  className,
  createNewFilter,
  isCreatingFilter = false,
}) => {
  console.log(`[FPD-${Date.now()}] Component rendered:`, {
    hasFilter: !!filter,
    isCreatingFilter,
  });

  const [open, setOpen] = useState(false);

  // Use the provided filter or null
  const activeFilter = filter || null;

  // Get a simplified text representation of the filter
  const filterSummary = getFilterSummary(activeFilter);

  // Count the number of conditions
  const conditionCount = countConditions(activeFilter);

  // Handle clearing the filter
  const handleClearFilter = (e: React.MouseEvent) => {
    console.log(`[FPD-${Date.now()}] handleClearFilter called`);
    e.stopPropagation();
    if (onChange) {
      onChange({ type: "and", expressions: [] });
    }
    setOpen(false);
  };

  // Handle clicking the filter button
  const handleFilterButtonClick = async (e: React.MouseEvent) => {
    console.log(`[FPD-${Date.now()}] handleFilterButtonClick called`, {
      hasFilter: !!filter,
      isCreatingFilter,
      isPopoverOpen: open,
    });

    // Prevent default behavior
    e.preventDefault();
    e.stopPropagation();

    if (isCreatingFilter) {
      console.log(
        `[FPD-${Date.now()}] Already creating a filter, ignoring click`
      );
      return;
    }

    // If there's no filter and we have a createNewFilter function, call it
    if (!filter && createNewFilter) {
      console.log(
        `[FPD-${Date.now()}] No filter exists, creating new filter...`
      );
      try {
        console.log(`[FPD-${Date.now()}] Calling createNewFilter()`);
        await createNewFilter();
        console.log(`[FPD-${Date.now()}] createNewFilter() completed`);
      } catch (error) {
        console.error(`[FPD-${Date.now()}] Error creating filter:`, error);
      }
    } else if (filter) {
      // If we already have a filter, just toggle the popover
      console.log(
        `[FPD-${Date.now()}] Filter exists, toggling popover from ${open} to ${!open}`
      );
      setOpen(!open);
    }
  };

  // Monitor for changes to the filter prop
  // When the filter becomes available (after creation), open the popover
  useEffect(() => {
    console.log(
      `[FPD-${Date.now()}] useEffect[filter, open, isCreatingFilter] triggered:`,
      {
        hasFilter: !!filter,
        isCreatingFilter,
        isPopoverOpen: open,
      }
    );

    // If we now have a filter and the popover is not open and we're not in the middle of creating a filter
    if (filter && !open && !isCreatingFilter) {
      console.log(
        `[FPD-${Date.now()}] Filter available, opening popover automatically`
      );
      // Open the popover to show the filter editor
      setOpen(true);
    }
  }, [filter, open, isCreatingFilter]);

  // Determine if we should show the filter editor or a placeholder
  const showFilterEditor = !!filter && !isCreatingFilter;

  // Add an effect to log state changes
  useEffect(() => {
    console.log(`[FPD-${Date.now()}] State update:`, {
      hasFilter: !!filter,
      isPopoverOpen: open,
      isCreatingFilter,
      showFilterEditor,
    });
  }, [filter, open, isCreatingFilter, showFilterEditor]);

  // Log popover content rendering
  useEffect(() => {
    if (open) {
      console.log(`[FPD-${Date.now()}] PopoverContent should render, state:`, {
        isCreatingFilter,
        showFilterEditor,
        hasFilter: !!filter,
      });

      // Log the specific render state
      if (isCreatingFilter) {
        console.log(`[FPD-${Date.now()}] Will render loading state`);
      } else if (showFilterEditor) {
        console.log(`[FPD-${Date.now()}] Will render FilterASTEditor`);
      } else {
        console.log(`[FPD-${Date.now()}] Will render empty state message`);
      }
    }
  }, [open, isCreatingFilter, showFilterEditor, filter]);

  return (
    <div className={className}>
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          console.log(`[FPD-${Date.now()}] Popover onOpenChange called:`, {
            currentOpen: open,
            newOpen: isOpen,
            hasFilter: !!filter,
            isCreatingFilter,
          });

          // Only allow manual closing, but not opening without a filter
          if (!isOpen) {
            console.log(`[FPD-${Date.now()}] Closing popover`);
            setOpen(false);
          } else if (filter) {
            // Only open if we have a filter
            console.log(
              `[FPD-${Date.now()}] Opening popover because filter exists`
            );
            setOpen(true);
          } else if (!isCreatingFilter) {
            // If trying to open but no filter exists yet, create one first
            console.log(
              `[FPD-${Date.now()}] Popover trying to open without filter, triggering filter creation`
            );
            handleFilterButtonClick(
              new MouseEvent("click") as unknown as React.MouseEvent
            );
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant={conditionCount > 0 ? "default" : "outline"}
            className="h-9 px-3 flex items-center gap-1 text-sm"
            onClick={(e) => {
              console.log(`[FPD-${Date.now()}] Button clicked`);
              handleFilterButtonClick(e);
            }}
            disabled={isCreatingFilter}
          >
            <Filter className="h-4 w-4 mr-1" />
            <span className="max-w-[200px] truncate">
              {isCreatingFilter ? "Creating filter..." : filterSummary}
            </span>
            {conditionCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 rounded-full"
              >
                {conditionCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-4" align="start">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Filter Editor</h3>
            {conditionCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleClearFilter}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            )}
          </div>

          {isCreatingFilter ? (
            <div className="py-8 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
              <p className="mt-4 text-muted-foreground">
                Creating your filter...
              </p>
            </div>
          ) : showFilterEditor ? (
            <>
              <FilterASTEditor
                filter={filter!}
                onChange={(newFilter) => {
                  if (onChange) {
                    onChange(newFilter);
                  }
                }}
              />
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No filter created yet.</p>
              <p className="mt-2">Click the button to create one.</p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
