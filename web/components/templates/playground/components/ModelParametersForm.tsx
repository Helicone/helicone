import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, PencilIcon, Settings2Icon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PopoverContent } from "@/components/ui/popover";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ResponseFormatModal from "./ResponseFormatModal";
import { cn } from "@/lib/utils";

interface ModelParameters {
  temperature: number | undefined | null;
  maxTokens: number | undefined | null;
  topP: number | undefined | null;
  frequencyPenalty: number | undefined | null;
  presencePenalty: number | undefined | null;
  stop: string | undefined | null;
}

interface ModelParametersFormProps {
  isScrolled: boolean;
  parameters: ModelParameters;
  onParametersChange: (_parameters: ModelParameters) => void;
  responseFormat: {
    type: string;
    json_schema?: string;
  };
  onResponseFormatChange: (_responseFormat: {
    type: string;
    json_schema?: string;
  }) => void;
}

export default function ModelParametersForm({
  isScrolled,
  parameters = {
    temperature: undefined,
    maxTokens: undefined,
    topP: undefined,
    frequencyPenalty: undefined,
    presencePenalty: undefined,
    stop: undefined,
  },
  onParametersChange,
  responseFormat,
  onResponseFormatChange,
}: ModelParametersFormProps) {
  const updateParameter = (key: keyof ModelParameters, value: any) => {
    onParametersChange({
      ...parameters,
      [key]: value,
    });
  };

  const toggleDefault = (key: keyof ModelParameters) => {
    onParametersChange({
      ...parameters,
      [key]: parameters[key] === undefined ? 0 : undefined,
    });
  };

  const [isModelParametersPopoverOpen, setIsModelParametersPopoverOpen] =
    useState(false);
  const [isResponseFormatModalOpen, setIsResponseFormatModalOpen] =
    useState(false);

  return (
    <>
      <Popover
        open={isModelParametersPopoverOpen}
        onOpenChange={setIsModelParametersPopoverOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "border-none h-9 w-9",
              isScrolled &&
                "bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900"
            )}
          >
            <Settings2Icon className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 mr-2">
          <div className="flex flex-col gap-4 py-4 w-full">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="responseFormat">Response Format</Label>
                </div>
                {responseFormat.type === "json_schema" && (
                  <PencilIcon
                    onClick={() => setIsResponseFormatModalOpen(true)}
                    className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground mr-2"
                  />
                )}
              </div>
              <Select
                onValueChange={(value) => {
                  if (value === "json_schema") {
                    setIsResponseFormatModalOpen(true);
                  } else {
                    onResponseFormatChange({
                      type: value,
                      json_schema: undefined,
                    });
                  }
                }}
                value={responseFormat.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Response Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json_schema">JSON Schema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Controls randomness: Lower values are more deterministic,
                      higher values more random.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="temperature-default"
                    checked={parameters.temperature === undefined}
                    onCheckedChange={() => toggleDefault("temperature")}
                  />
                  <Label htmlFor="temperature-default">Use Default</Label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[parameters.temperature ?? 0]}
                  onValueChange={([value]) =>
                    updateParameter("temperature", value)
                  }
                  className="flex-1"
                  disabled={parameters.temperature === undefined}
                />
                <Input
                  type="number"
                  value={parameters.temperature ?? 0}
                  onChange={(e) =>
                    updateParameter("temperature", parseFloat(e.target.value))
                  }
                  className="w-20"
                  min={0}
                  max={2}
                  step={0.1}
                  disabled={parameters.temperature === undefined}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Maximum number of tokens to generate in the response.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="maxTokens-default"
                    checked={parameters.maxTokens === undefined}
                    onCheckedChange={() => toggleDefault("maxTokens")}
                  />
                  <Label htmlFor="maxTokens-default">Use Default</Label>
                </div>
              </div>
              <Input
                id="maxTokens"
                type="number"
                value={parameters.maxTokens ?? 0}
                onChange={(e) =>
                  updateParameter("maxTokens", parseInt(e.target.value))
                }
                min={1}
                disabled={parameters.maxTokens === undefined}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="topP">Top P</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Controls diversity via nucleus sampling: 0.5 means half of
                      all likelihood-weighted options are considered.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="topP-default"
                    checked={parameters.topP === undefined}
                    onCheckedChange={() => toggleDefault("topP")}
                  />
                  <Label htmlFor="topP-default">Use Default</Label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="topP"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[parameters.topP ?? 0]}
                  onValueChange={([value]) => updateParameter("topP", value)}
                  className="flex-1"
                  disabled={parameters.topP === undefined}
                />
                <Input
                  type="number"
                  value={parameters.topP ?? 0}
                  onChange={(e) =>
                    updateParameter("topP", parseFloat(e.target.value))
                  }
                  className="w-20"
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={parameters.topP === undefined}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Reduces repetition of token sequences based on their
                      frequency.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="frequencyPenalty-default"
                    checked={parameters.frequencyPenalty === undefined}
                    onCheckedChange={() => toggleDefault("frequencyPenalty")}
                  />
                  <Label htmlFor="frequencyPenalty-default">Use Default</Label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="frequencyPenalty"
                  min={-2}
                  max={2}
                  step={0.1}
                  value={[parameters.frequencyPenalty ?? 0]}
                  onValueChange={([value]) =>
                    updateParameter("frequencyPenalty", value)
                  }
                  className="flex-1"
                  disabled={parameters.frequencyPenalty === undefined}
                />
                <Input
                  type="number"
                  value={parameters.frequencyPenalty ?? 0}
                  onChange={(e) =>
                    updateParameter(
                      "frequencyPenalty",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-20"
                  min={-2}
                  max={2}
                  step={0.1}
                  disabled={parameters.frequencyPenalty === undefined}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="presencePenalty">Presence Penalty</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Reduces repetition of token sequences based on their
                      presence in the text.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="presencePenalty-default"
                    checked={parameters.presencePenalty === undefined}
                    onCheckedChange={() => toggleDefault("presencePenalty")}
                  />
                  <Label htmlFor="presencePenalty-default">Use Default</Label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="presencePenalty"
                  min={-2}
                  max={2}
                  step={0.1}
                  value={[parameters.presencePenalty ?? 0]}
                  onValueChange={([value]) =>
                    updateParameter("presencePenalty", value)
                  }
                  className="flex-1"
                  disabled={parameters.presencePenalty === undefined}
                />
                <Input
                  type="number"
                  value={parameters.presencePenalty ?? 0}
                  onChange={(e) =>
                    updateParameter(
                      "presencePenalty",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-20"
                  min={-2}
                  max={2}
                  step={0.1}
                  disabled={parameters.presencePenalty === undefined}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="stop">Stop Sequences</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Sequences where the API will stop generating further
                      tokens.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="stop-default"
                    checked={parameters.stop === undefined}
                    onCheckedChange={() => toggleDefault("stop")}
                  />
                  <Label htmlFor="stop-default">Use Default</Label>
                </div>
              </div>
              <Input
                id="stop"
                value={parameters.stop ?? ""}
                onChange={(e) => updateParameter("stop", e.target.value)}
                placeholder="Enter stop sequences separated by commas"
                disabled={parameters.stop === undefined}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <ResponseFormatModal
        open={isResponseFormatModalOpen}
        setOpen={setIsResponseFormatModalOpen}
        responseFormat={responseFormat.json_schema ?? ""}
        onResponseFormatChange={(format) => {
          onResponseFormatChange({
            type: format ? "json_schema" : "text",
            json_schema: format ? format : undefined,
          });
        }}
      />
    </>
  );
}
