import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TemplateVariable } from "@helicone-package/prompts/types";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { useVariableColorMapStore } from "@/store/features/playground/variableColorMap";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { VariableInput } from "../types";

interface PlaygroundVariablesPanelProps {
  variables: Map<string, TemplateVariable>;
  values: Record<string, VariableInput>;
  onUpdateValue: (name: string, { isObject, value }: VariableInput) => void;
}

const PlaygroundVariablesPanel = ({
  variables,
  values,
  onUpdateValue,
}: PlaygroundVariablesPanelProps) => {
  const [editObjectModes, setEditObjectModes] = useState<Set<string>>(new Set());
  const { getColor } = useVariableColorMapStore();

  const toggleEditObject = (name: string) => {
    setEditObjectModes(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });

    onUpdateValue(name, { isObject: editObjectModes.has(name), value: values[name]?.value || "" });
  };

  const handleValueChange = (name: string, value: string) => {
    onUpdateValue(name, { isObject: editObjectModes.has(name), value });
  };

  return (
    <ScrollArea className="w-full h-full">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-medium">Prompt Variables</h2>
        </div>
        <div className="p-4">
          {variables.size === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">No template variables detected</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {Array.from(variables.entries()).map(([name, variable]) => (
                <div key={name} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm text-${getColor(name)}`}>{name}</span>
                      <code className="px-1 py-0.5 bg-muted rounded text-xs">{variable.type}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`edit-object-${name}`} className="text-xs text-muted-foreground">
                        Edit Object
                      </Label>
                      <Switch
                        id={`edit-object-${name}`}
                        className="data-[state=checked]:bg-foreground"
                        size="sm"
                        variant="helicone"
                        checked={editObjectModes.has(name)}
                        onCheckedChange={() => toggleEditObject(name)}
                      />
                    </div>
                  </div>
                  {editObjectModes.has(name) ? (
                    <MarkdownEditor
                      placeholder={`Enter ${variable.type} value...`}
                      language="json"
                      setText={(value) => handleValueChange(name, value)}
                      text={values[name]?.value || ""}
                      className="min-h-[100px] border-border border-2"
                    />
                  ) : (
                    <Input
                      placeholder={`Enter ${variable.type} value...`}
                      value={values[name]?.value || ""}
                      onChange={(e) => handleValueChange(name, e.target.value)}
                    />
                  )}
                  <div className="text-xs text-muted-foreground font-mono">
                    {variable.raw}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default PlaygroundVariablesPanel; 