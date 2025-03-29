import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FilterSubType } from "@/filterAST/filterAst";

export type SearchableSelectOption = {
  label: string;
  value: string;
  subType?: FilterSubType;
};

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  width?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Select option",
  emptyMessage = "No options found.",
  searchPlaceholder = "Search...",
  disabled = false,
  width = "200px",
  className,
}) => {
  const [open, setOpen] = useState(false);

  // Get the current label for the selected value
  const getCurrentLabel = () => {
    if (!value) return placeholder;
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  // Group options by subType
  const groupedOptions = useMemo(() => {
    const regular = options.filter((opt) => !opt.subType);
    const properties = options.filter((opt) => opt.subType === "property");
    const scores = options.filter((opt) => opt.subType === "score");
    const sessions = options.filter((opt) => opt.subType === "sessions");
    const users = options.filter((opt) => opt.subType === "user");

    return {
      regular,
      properties,
      scores,
      sessions,
      users,
      hasSubTypes:
        properties.length > 0 ||
        scores.length > 0 ||
        sessions.length > 0 ||
        users.length > 0,
    };
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            `justify-between w-[${width}] font-normal text-[10px]`,
            className
          )}
          disabled={disabled}
        >
          {getCurrentLabel()}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50 " />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-[${width}] p-0`}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-7 text-[10px]"
          />
          <CommandEmpty className="text-[10px]">{emptyMessage}</CommandEmpty>
          <CommandList>
            {/* Property subtype options */}
            {groupedOptions.users.length > 0 && (
              <CommandGroup heading="Users">
                {groupedOptions.users.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(selectedValue) => {
                      onValueChange(selectedValue);
                      setOpen(false);
                    }}
                    className="text-[10px]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Property subtype options */}
            {groupedOptions.sessions.length > 0 && (
              <CommandGroup heading="Sessions">
                {groupedOptions.sessions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(selectedValue) => {
                      onValueChange(selectedValue);
                      setOpen(false);
                    }}
                    className="text-[10px]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Regular options */}
            {groupedOptions.regular.length > 0 && (
              <CommandGroup
                heading={
                  groupedOptions.users.length > 0 ||
                  groupedOptions.sessions.length > 0
                    ? "Default"
                    : undefined
                }
              >
                {groupedOptions.regular.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(selectedValue) => {
                      onValueChange(selectedValue);
                      setOpen(false);
                    }}
                    className="text-[10px]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Separator if we have both regular options and subtypes */}
            {groupedOptions.hasSubTypes &&
              groupedOptions.regular.length > 0 && <CommandSeparator />}

            {/* Property subtype options */}
            {groupedOptions.properties.length > 0 && (
              <CommandGroup heading="Properties">
                {groupedOptions.properties.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(selectedValue) => {
                      onValueChange(selectedValue);
                      setOpen(false);
                    }}
                    className="text-[10px]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Score subtype options */}
            {groupedOptions.scores.length > 0 && (
              <CommandGroup heading="Scores">
                {groupedOptions.scores.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(selectedValue) => {
                      onValueChange(selectedValue);
                      setOpen(false);
                    }}
                    className="text-[10px]"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
