import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { P, Small } from "@/components/ui/typography";
import { toSnakeCase } from "@/utils/strings";
import { Tool } from "packages/llm-mapper/types";
import { useState } from "react";
import {
  PiNumberCircleOneBold,
  PiPlusBold,
  PiTextTBold,
  PiToggleRightBold,
  PiTrashBold,
} from "react-icons/pi";
import GlassHeader from "../universal/GlassHeader";
import PromptBox from "./PromptBox";

type ParameterType = "string" | "number" | "boolean";
type Parameter = {
  name: string;
  type: ParameterType;
  description: string;
  required: boolean;
};

interface ToolEditorProps {
  onSave: (tool: Tool) => void;
  onCancel: () => void;
}
export default function ToolEditor({ onSave, onCancel }: ToolEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState<Parameter[]>([]);

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      { name: "", type: "string", description: "", required: true },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterNameChange = (index: number, name: string) => {
    const updatedParameters = [...parameters];
    updatedParameters[index].name = name;
    setParameters(updatedParameters);
  };

  const handleParameterDescriptionChange = (
    index: number,
    description: string
  ) => {
    const updatedParameters = [...parameters];
    updatedParameters[index].description = description;
    setParameters(updatedParameters);
  };

  const handleParameterTypeChange = (index: number) => {
    const updatedParameters = [...parameters];
    const currentType = updatedParameters[index].type;

    // Cycle through types: string -> number -> boolean -> string
    let newType: ParameterType = "string";
    if (currentType === "string") newType = "number";
    else if (currentType === "number") newType = "boolean";

    updatedParameters[index].type = newType;
    setParameters(updatedParameters);
  };

  const handleParameterRequiredChange = (index: number, required: boolean) => {
    const updatedParameters = [...parameters];
    updatedParameters[index].required = required;
    setParameters(updatedParameters);
  };

  const handleSave = () => {
    // Create properties object from parameters
    const properties: Record<string, any> = {};

    parameters.forEach((param) => {
      const snakeCaseName = toSnakeCase(param.name);
      properties[snakeCaseName] = {
        type: param.type,
        description: param.description,
      };
    });

    const tool: Tool = {
      name: toSnakeCase(name),
      description,
      parameters: {
        type: "object",
        properties,
        required: parameters
          .filter((p) => p.required)
          .map((p) => toSnakeCase(p.name)),
      },
    };

    onSave(tool);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <GlassHeader className="h-14 flex-shrink-0 px-4">
          <h2 className="font-semibold text-secondary">Name</h2>
        </GlassHeader>
        <div className="px-4">
          <Input
            id="tool-name"
            placeholder="Enter tool name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <GlassHeader className="h-14 flex-shrink-0 px-4">
          <h2 className="font-semibold text-secondary">Description</h2>
        </GlassHeader>
        <PromptBox value={description} onChange={setDescription} />
      </div>

      <ScrollArea className="h-64">
        <GlassHeader className="h-14 flex-shrink-0 px-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="font-semibold text-secondary">
              Parameters ({parameters.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddParameter}
              className="flex items-center gap-1"
            >
              <PiPlusBold className="w-4 h-4" />
              Add Parameter
            </Button>
          </div>
        </GlassHeader>
        <div className="flex flex-col gap-2 px-4">
          {parameters.length === 0 && (
            <P className="text-muted-foreground text-center py-4">
              No parameters added yet.
            </P>
          )}

          {parameters.map((param, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Parameter name"
                    value={param.name}
                    onChange={(e) =>
                      handleParameterNameChange(index, e.target.value)
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleParameterTypeChange(index)}
                    className="flex items-center gap-1.5"
                  >
                    {param.type === "string" && (
                      <PiTextTBold className="w-4 h-4" />
                    )}
                    {param.type === "number" && (
                      <PiNumberCircleOneBold className="w-4 h-4" />
                    )}
                    {param.type === "boolean" && (
                      <PiToggleRightBold className="w-4 h-4" />
                    )}
                    {param.type}
                  </Button>

                  <div className="flex items-center gap-1">
                    <Small className="text-muted-foreground">Required</Small>
                    <Switch
                      checked={param.required}
                      onCheckedChange={(checked) =>
                        handleParameterRequiredChange(index, checked)
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="square_icon"
                    onClick={() => handleRemoveParameter(index)}
                  >
                    <PiTrashBold className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Parameter description"
                  value={param.description}
                  onChange={(e) =>
                    handleParameterDescriptionChange(index, e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 mt-4 p-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="action"
          onClick={handleSave}
          disabled={!name || !description}
        >
          Save Tool
        </Button>
      </div>
    </div>
  );
}
