import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptFormProps {
  isScrolled: boolean;
  promptId: string | undefined;
  onSavePrompt: (model: string, tags: string[], promptName: string) => void;
}

export default function PromptForm({
  isScrolled,
  promptId,
  onSavePrompt,
}: PromptFormProps) {
  const [model, setModel] = useState("");
  const [promptName, setPromptName] = useState("");
  const [isPromptFormPopoverOpen, setIsPromptFormPopoverOpen] = useState(false);

  return (
    <Popover
      open={isPromptFormPopoverOpen}
      onOpenChange={setIsPromptFormPopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "border-none",
            isScrolled &&
              "bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900"
          )}
        >
          Save Prompt
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 mr-2">
        <div className="flex flex-col gap-4 py-4 w-full">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="model">Model</Label>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Model slug that will be used when using this prompt in
                  production.
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={model} onValueChange={(value) => setModel(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-2">Claude 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="promptName">Prompt Name</Label>
            </div>
            <Input
              id="promptName"
              value={promptName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPromptName(e.target.value)
              }
              placeholder="new-prompt"
              className="w-full"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              onSavePrompt(model, [], promptName);
              setIsPromptFormPopoverOpen(false);
            }}
          >
            {promptId ? "Save Prompt" : "Create Prompt"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
