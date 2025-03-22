"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { useEffect } from "react";

export type SelectOption = {
  icon?: React.ReactNode;
  value: string;
  label: string;
};

export interface MultiSelectProps {
  options: SelectOption[];
  selected?: SelectOption[];
  onChange?: (selected: SelectOption[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [selectedItems, setSelectedItems] =
    React.useState<SelectOption[]>(selected);
  const [inputValue, setInputValue] = React.useState("");
  const [showPlaceholder, setShowPlaceholder] = React.useState(true);

  // Update internal state when selected prop changes
  useEffect(() => {
    setSelectedItems(selected);
  }, [selected]);

  // Check if placeholder should be shown based on selected items
  useEffect(() => {
    // Only show placeholder when there are no selected items or when input is focused
    setShowPlaceholder(selectedItems.length === 0 || open);
  }, [selectedItems, open]);

  const handleUnselect = React.useCallback(
    (option: SelectOption) => {
      const newSelected = selectedItems.filter((s) => s.value !== option.value);
      setSelectedItems(newSelected);
      onChange?.(newSelected);
    },
    [selectedItems, onChange]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && selectedItems.length > 0) {
            const newSelected = [...selectedItems];
            newSelected.pop();
            setSelectedItems(newSelected);
            onChange?.(newSelected);
          }
        }
        // This is not a default behaviour of the <input /> field
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    [selectedItems, onChange]
  );

  const selectables = options.filter(
    (option) => !selectedItems.some((item) => item.value === option.value)
  );

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={`overflow-visible bg-transparent ${className || ""}`}
    >
      <div className="group rounded-md border border-input px-3 h-full flex items-center text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((option) => {
            return (
              <Badge key={option.value} variant="secondary">
                {option.icon && (
                  <span className="mr-1.5 inline-flex items-center">
                    {option.icon}
                  </span>
                )}
                {option.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          {/* Avoid having the "Search" Icon */}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => {
              setOpen(true);
              setShowPlaceholder(true);
            }}
            placeholder={showPlaceholder ? placeholder : ""}
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[60px]"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((option) => {
                  return (
                    <CommandItem
                      key={option.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        setInputValue("");
                        const newSelected = [...selectedItems, option];
                        setSelectedItems(newSelected);
                        onChange?.(newSelected);
                      }}
                      className={"cursor-pointer"}
                    >
                      {option.icon && (
                        <span className="mr-2 inline-flex items-center">
                          {option.icon}
                        </span>
                      )}
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
