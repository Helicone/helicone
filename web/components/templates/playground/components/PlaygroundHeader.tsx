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
import { Tool } from "@helicone-package/llm-mapper/types";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { ModelParameters } from "../playgroundPage";
import ModelParametersForm from "./ModelParametersForm";
import ToolsConfigurationModal from "./ToolsConfigurationModal";

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
}: PlaygroundHeaderProps) => {
  const [modelListOpen, setModelListOpen] = useState<boolean>(false);
  return (
    <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-sidebar-background w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex justify-between items-center w-full cursor-pointer">
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
                className="w-[200px] justify-between"
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
            <ToolsConfigurationModal tools={tools} onToolsChange={setTools} />

            <ModelParametersForm
              responseFormat={responseFormat}
              onResponseFormatChange={setResponseFormat}
              parameters={modelParameters}
              onParametersChange={setModelParameters}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap text-slate-500">
          {Object.entries(modelParameters).map(([key, value], index) => (
            <div key={index}>
              <p className="text-xs">
                <span className="font-medium">{key}:</span>{" "}
                {!value
                  ? "Default"
                  : typeof value === "string"
                  ? value
                  : Array.isArray(value)
                  ? value.length > 0
                    ? value.join(", ")
                    : "[]"
                  : value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaygroundHeader;
