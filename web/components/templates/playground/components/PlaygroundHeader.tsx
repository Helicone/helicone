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
import { MappedLLMRequest, Tool } from "@helicone-package/llm-mapper/types";
import { CheckIcon, ChevronsUpDownIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { ModelParameters } from "@/lib/api/llm/generate";
import ModelParametersForm from "./ModelParametersForm";
import ToolsConfigurationModal from "./ToolsConfigurationModal";
import PlaygroundActions from "./PlaygroundActions";
import { ResponseFormat } from "../types";
import { useModelRegistry } from "@/services/hooks/useModelRegistry";

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
  const { data: playgroundModels, isLoading: modelsLoading } = useModelRegistry();

  // Get display name for selected model
  const selectedModelData = playgroundModels?.find(
    (m) => m.id === selectedModel,
  );
  const displayName = selectedModelData?.name || selectedModel || "Select model...";
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
                <span className="max-w-[150px] truncate" title={displayName}>
                  {displayName}
                </span>
                <ChevronsUpDownIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Search model..." />
                <CommandList>
                  {modelsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading models...
                      </span>
                    </div>
                  ) : !playgroundModels || playgroundModels.length === 0 ? (
                    <CommandEmpty>No models found.</CommandEmpty>
                  ) : (
                    <>
                      <CommandEmpty>No model found.</CommandEmpty>
                      <CommandGroup>
                        {playgroundModels.map((model) => (
                          <CommandItem
                            key={model.id}
                            value={model.id}
                            onSelect={(currentValue) => {
                              setSelectedModel(
                                currentValue === selectedModel
                                  ? ""
                                  : currentValue,
                              );
                              setModelListOpen(false);
                            }}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm">{model.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.provider}
                                {model.supportsPtb && " • PTB"}
                              </span>
                            </div>
                            <CheckIcon
                              className={cn(
                                "ml-auto flex-shrink-0",
                                model.id === selectedModel
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                              size={16}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
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
