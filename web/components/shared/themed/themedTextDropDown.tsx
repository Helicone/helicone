import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Result } from "@/packages/common/result";

interface ThemedTextDropDownProps {
  options: string[];
  onChange: (option: string | null) => void;
  value: string;
  onSearchHandler?: (search: string) => Promise<Result<void, string>>;
  hideTabModes?: boolean;
}

export function ThemedTextDropDown(props: ThemedTextDropDownProps) {
  const {
    options: parentOptions,
    onChange,
    value,
    onSearchHandler,
    hideTabModes = false,
  } = props;

  const [query, setQuery] = useState("");
  const [tabMode, __setTabMode] = useState<"smart" | "raw">("smart");
  const [open, setOpen] = useState(false);

  const handleValueChange = (value: string) => {
    setQuery(value);
    onChange(value);
    setOpen(false);
  };

  const filteredOptions = Array.from(new Set([...parentOptions, query]))
    .filter(Boolean)
    .sort()
    .filter((option) => option.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex w-full flex-col gap-1">
      {!hideTabModes && (
        <div className="flex w-full items-center justify-end gap-1 text-xs">
          <div>{/* Your Tab implementation goes here */}</div>
        </div>
      )}
      {tabMode === "smart" ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-xs"
              size="md_sleek"
            >
              {value || "Select or enter a value"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput
                placeholder="Select or enter a value"
                value={query}
                onValueChange={(value) => {
                  setQuery(value);
                  onSearchHandler?.(value);
                }}
                className="h-6 text-xs"
              />
              <CommandList>
                {filteredOptions.length === 0 && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}
                <CommandGroup>
                  {filteredOptions.map((option, i) => (
                    <CommandItem
                      key={`${i}-${option}`}
                      value={option}
                      onSelect={() => handleValueChange(option)}
                      className="text-xs"
                    >
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          placeholder="Enter a value"
        />
      )}
    </div>
  );
}
