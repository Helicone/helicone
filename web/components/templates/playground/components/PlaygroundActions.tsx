import { Button } from "@/components/ui/button";

import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip";
import PromptForm from "./PromptForm";
import { MappedLLMRequest, Tool } from "@helicone-package/llm-mapper/types";
import _ from "lodash";
import { ModelParameters } from "@/lib/api/llm/generate";
import { DEFAULT_EMPTY_CHAT } from "../playgroundPage";
import { CommandIcon, Undo2Icon } from "lucide-react";
import { useOrg } from "@/components/layout/org/organizationContext";
import { logger } from "@/lib/telemetry/logger";

interface PlaygroundActionsProps {
  mappedContent: MappedLLMRequest | null;
  defaultContent: MappedLLMRequest | null;
  setMappedContent: (_mappedContent: MappedLLMRequest) => void;
  setModelParameters: (_modelParameters: ModelParameters) => void;
  setTools: (_tools: Tool[]) => void;
  promptVersionId: string | undefined;
  onCreatePrompt: (tags: string[], promptName: string) => void;
  onSavePrompt: (
    newMajorVersion: boolean,
    environment: string | undefined,
    commitMessage: string,
  ) => void;
  onRun: () => void;
  requestId?: string;
  isScrolled: boolean;
  isLoading?: boolean;
  createPrompt?: boolean;
}
const PlaygroundActions = ({
  mappedContent,
  defaultContent,
  setMappedContent,
  setModelParameters,
  setTools,
  promptVersionId,
  onCreatePrompt,
  onSavePrompt,
  onRun,
  requestId,
  isScrolled,
  isLoading = false,
  createPrompt,
}: PlaygroundActionsProps) => {
  const resetToDefault = () => {
    logger.debug(
      {
        defaultContent: !!defaultContent,
        mappedContent: !!mappedContent,
        requestId,
      },
      "Reset triggered",
    );

    if (defaultContent) {
      logger.debug("Setting to default content");
      // Reset all states in sequence
      setModelParameters({
        temperature: defaultContent.schema.request.temperature,
        max_tokens: defaultContent.schema.request.max_tokens,
        top_p: defaultContent.schema.request.top_p,
        frequency_penalty: defaultContent.schema.request.frequency_penalty,
        presence_penalty: defaultContent.schema.request.presence_penalty,
        stop: defaultContent.schema.request.stop
          ? Array.isArray(defaultContent.schema.request.stop)
            ? defaultContent.schema.request.stop.join(",")
            : defaultContent.schema.request.stop
          : undefined,
      });
      setTools(defaultContent.schema.request.tools || []);
      setMappedContent(defaultContent);
    } else {
      logger.debug("Setting to empty chat");
      // Reset all states in sequence
      setTools([]);
      setModelParameters({
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: undefined,
      });
      setMappedContent(DEFAULT_EMPTY_CHAT);
    }
  };
  return (
    <div className="flex items-center gap-2">
      {mappedContent && !_.isEqual(mappedContent, defaultContent) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={resetToDefault}>
              <Undo2Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Reset to {requestId ? `original request` : "blank content"}
          </TooltipContent>
        </Tooltip>
      )}

      <PromptForm
        isScrolled={isScrolled}
        saveAndVersion={!!promptVersionId}
        onCreatePrompt={onCreatePrompt}
        onSavePrompt={onSavePrompt}
        autoOpen={createPrompt}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onRun} disabled={isLoading}>
            {isLoading ? "Running..." : "Run"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-1">
            <div className="rounded-md bg-muted p-1">
              <CommandIcon className="h-3 w-3" />
            </div>
            +{" "}
            <div className="py rounded-md bg-muted px-1">
              <kbd className="text-xs">Enter</kbd>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default PlaygroundActions;
