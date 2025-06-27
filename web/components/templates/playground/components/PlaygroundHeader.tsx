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
import { cn } from "@/lib/utils";
import { playgroundModels as PLAYGROUND_MODELS } from "@helicone-package/cost/providers/mappings";
import { MappedLLMRequest, Tool } from "@helicone-package/llm-mapper/types";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { ModelParameters } from "@/lib/api/llm/generate";
import ModelParametersForm from "./ModelParametersForm";
import ToolsConfigurationModal from "./ToolsConfigurationModal";
import PlaygroundActions from "./PlaygroundActions";

interface PlaygroundHeaderProps {
  selectedModel: string;
  setSelectedModel: (_model: string) => void;
  tools: Tool[];
  setTools: (_tools: Tool[]) => void;
  responseFormat: {
    type: string;
    json_schema?: string;
  };
  setResponseFormat: (_responseFormat: {
    type: string;
    json_schema?: string;
  }) => void;
  modelParameters: ModelParameters;
  setModelParameters: (_modelParameters: ModelParameters) => void;
  mappedContent: MappedLLMRequest | null;
  defaultContent: MappedLLMRequest | null;
  setMappedContent: (_mappedContent: MappedLLMRequest) => void;
  onRun: () => void;
  isScrolled: boolean;
  useAIGateway: boolean;
  setUseAIGateway: (_useAIGateway: boolean) => void;
}

const PlaygroundHeader = ({
  selectedModel,
  setSelectedModel,
  tools,
  setTools,
  responseFormat,
  setResponseFormat,
  modelParameters,
  setModelParameters,
  mappedContent,
  defaultContent,
  setMappedContent,
  onRun,
  isScrolled,
  useAIGateway,
  setUseAIGateway,
}: PlaygroundHeaderProps) => {
  const [modelListOpen, setModelListOpen] = useState<boolean>(false);
  return (
    <div
      className={cn(
        "flex justify-between items-center px-4 py-2 w-full",
        isScrolled
          ? "rounded-lg bg-background"
          : "border-t border-border bg-sidebar-background"
      )}
    >
      <div className="flex justify-between items-center gap-2 w-full">
        <div className="flex items-center gap-2 w-full cursor-pointer">
          <Popover open={modelListOpen} onOpenChange={setModelListOpen}>
            <PopoverTrigger
              asChild
              onClick={(e) => {
                e.stopPropagation();
                setModelListOpen(!modelListOpen);
              }}
            >
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={modelListOpen}
                className={cn(
                  "w-[200px] justify-between border-none",
                  isScrolled &&
                    "bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900"
                )}
              >
                <span className="truncate max-w-[150px]">
                  {selectedModel || "Select model..."}
                </span>
                <ChevronsUpDownIcon className="opacity-50 w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search model..." />
                <CommandList>
                  <CommandEmpty>No framework found.</CommandEmpty>
                  <CommandGroup>
                    {PLAYGROUND_MODELS.map((model) => (
                      <CommandItem
                        key={model}
                        value={model}
                        onSelect={(currentValue) => {
                          setSelectedModel(
                            currentValue === selectedModel ? "" : currentValue
                          );
                          setModelListOpen(false);
                        }}
                      >
                        {model}
                        <CheckIcon
                          className={cn(
                            "ml-auto",
                            model === selectedModel
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
            <ToolsConfigurationModal
              isScrolled={isScrolled}
              tools={tools}
              onToolsChange={setTools}
            />

            <ModelParametersForm
              isScrolled={isScrolled}
              responseFormat={responseFormat}
              onResponseFormatChange={setResponseFormat}
              parameters={modelParameters}
              onParametersChange={setModelParameters}
              useAIGateway={useAIGateway}
              setUseAIGateway={setUseAIGateway}
            />
          </div>
        </div>
        <PlaygroundActions
          mappedContent={mappedContent}
          defaultContent={defaultContent}
          setMappedContent={setMappedContent}
          setModelParameters={setModelParameters}
          setTools={setTools}
          onRun={onRun}
        />
      </div>
    </div>
  );
};

export default PlaygroundHeader;
