import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { logger } from "@/lib/telemetry/logger";

export type SearchableInputOption = {
  label: string;
  value: string;
};

interface SearchableInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (searchTerm: string) => Promise<SearchableInputOption[]>;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
}

export const SearchableInput: React.FC<SearchableInputProps> = ({
  value,
  onValueChange,
  onSearch,
  placeholder = "Type to search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  debounceMs = 300,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SearchableInputOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input changes and trigger search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the search to avoid too many requests
    debounceTimerRef.current = setTimeout(() => {
      if (newValue) {
        setLoading(true);
        onSearch(newValue)
          .then((results) => {
            setOptions(results);
            setOpen(true);
          })
          .catch((error) => {
            logger.error({ error }, "Search error");
            setOptions([]);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setOptions([]);
        setOpen(false);
      }
    }, debounceMs);
  };

  // Handle selection of an option
  const handleSelect = (selectedValue: string) => {
    const option = options.find((opt) => opt.value === selectedValue);
    if (option) {
      setInputValue(option.value);
      onValueChange(option.value);
    }
    setOpen(false);
  };

  // Handle blur of input
  const handleBlur = () => {
    // When input loses focus, update the external value
    onValueChange(inputValue);
    setOpen(false);
  };

  // Handle key down events on input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onValueChange(inputValue);
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <Popover open={open && options.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="w-full">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onFocus={() => onSearch(inputValue).then(setOptions)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn("h-8 w-full px-2 text-xs", className)}
            />
            {loading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command className="border border-border">
            <CommandList className="max-h-[200px] overflow-auto">
              <CommandEmpty className="py-2 text-xs">
                {emptyMessage}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    className="flex items-center py-1.5 text-xs"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchableInput;
