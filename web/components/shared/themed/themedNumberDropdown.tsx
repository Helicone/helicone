import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ThemedNumberDropdownProps {
  options: {
    key: string;
    param: string;
  }[];
  onChange: (option: string | null) => void;
  value: string;
}

const ThemedNumberDropdown = (props: ThemedNumberDropdownProps) => {
  const { options, onChange, value } = props;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleValueChange = (currentValue: string) => {
    setQuery(currentValue);
    onChange(options.find((o) => o.param === currentValue)?.key ?? null);
    setOpen(false);
  };

  const filteredOptions = Array.from(
    new Set([...options.map((o) => o.param), query])
  )
    .filter(Boolean)
    .sort()
    .filter((option) => option.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-full flex flex-col gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-xs"
            size="md_sleek"
          >
            {options.find((o) => o.key === value)?.param ||
              "Select or enter a value"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Select or enter a value"
              value={query}
              onValueChange={(value) => {
                setQuery(value);
              }}
              className="text-xs h-6"
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
    </div>
  );
};

export default ThemedNumberDropdown;
