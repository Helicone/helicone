import { useState } from "react";
import { Tags, CheckIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface TagsFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const TagsFilter = ({ tags, selectedTags, onTagsChange }: TagsFilterProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex items-center gap-2"
          >
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">
              {selectedTags.length === 0
                ? "All Tags"
                : `${selectedTags.length} selected`}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onTagsChange([]);
                    setOpen(false);
                  }}
                  className="mb-1"
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTags.length === 0
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  All Tags
                </CommandItem>
                <CommandSeparator />
                {tags.map((tag) => (
                  <CommandItem
                    key={tag}
                    onSelect={() => {
                      if (selectedTags.includes(tag)) {
                        onTagsChange(selectedTags.filter(t => t !== tag));
                      } else {
                        onTagsChange([...selectedTags, tag]);
                      }
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 min-w-4 min-h-4 max-h-4 max-w-4 max-w-4 max-w-4",
                        selectedTags.includes(tag)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="truncate">{tag}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default TagsFilter; 