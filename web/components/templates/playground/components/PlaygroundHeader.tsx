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
import { ResponseFormat } from "../types";

interface PlaygroundHeaderProps {
  selectedModel: string;
  setSelectedModel: (_model: string) => void;
  tools: Tool[];
  setTools: (_tools: Tool[]) => void;
  responseFormat: ResponseFormat;
  setResponseFormat: (_responseFormat: ResponseFormat) => void;
  modelParameters: ModelParameters;
  setModelParameters: (_modelParameters: ModelParameters) => void;
  mappedContent: MappedLLMRequest | null;
  defaultContent: MappedLLMRequest | null;
  setMappedContent: (_mappedContent: MappedLLMRequest) => void;
  promptVersionId: string | undefined;
  onCreatePrompt: (tags: string[], promptName: string) => void;
  onSavePrompt: (
    newMajorVersion: boolean,
    environment: string | undefined,
    commitMessage: string,
  ) => void;
  onRun: () => void;
  isScrolled: boolean;
  useAIGateway: boolean;
  setUseAIGateway: (_useAIGateway: boolean) => void;
  error: string | null;
  isLoading?: boolean;
  createPrompt?: boolean;
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
  promptVersionId,
  onCreatePrompt,
  onSavePrompt,
  onRun,
  isScrolled,
  useAIGateway,
  setUseAIGateway,
  error,
  isLoading,
  createPrompt,
}: PlaygroundHeaderProps) => {
  const [modelListOpen, setModelListOpen] = useState<boolean>(false);
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between px-4 py-2",
        isScrolled
          ? "rounded-lg bg-background"
          : "border-t border-border bg-sidebar-background",
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex w-full cursor-pointer items-center gap-2">
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
                    "bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900",
                )}
              >
                <span className="max-w-[150px] truncate">
                  {selectedModel || "Select model..."}
                </span>
                <ChevronsUpDownIcon className="h-4 w-4 opacity-50" />
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
                            currentValue === selectedModel ? "" : currentValue,
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
                              : "opacity-0",
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
              error={error}
            />
          </div>
        </div>
        <PlaygroundActions
          mappedContent={mappedContent}
          defaultContent={defaultContent}
          setMappedContent={setMappedContent}
          setModelParameters={setModelParameters}
          setTools={setTools}
          promptVersionId={promptVersionId}
          onCreatePrompt={onCreatePrompt}
          onSavePrompt={onSavePrompt}
          onRun={onRun}
          isScrolled={isScrolled}
          isLoading={isLoading}
          createPrompt={createPrompt}
        />
      </div>
    </div>
  );
};

export default PlaygroundHeader;
