import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TemplateVariable } from "@helicone-package/prompts/types";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useVariableColorMapStore } from "@/store/features/playground/variableColorMap";

interface PlaygroundVariablesPanelProps {
  variables: Map<string, TemplateVariable>;
  values: Map<string, string>;
  onUpdateValue: (name: string, value: string) => void;
}

const PlaygroundVariablesPanel = ({
  variables,
  values,
  onUpdateValue,
}: PlaygroundVariablesPanelProps) => {
  const [longTextModes, setLongTextModes] = useState<Set<string>>(new Set());
  const { getColor } = useVariableColorMapStore();

  const toggleLongText = (name: string) => {
    setLongTextModes(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
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
                      <Label htmlFor={`long-text-${name}`} className="text-xs text-muted-foreground">
                        Long Text
                      </Label>
                      <Switch
                        id={`long-text-${name}`}
                        className="data-[state=checked]:bg-foreground"
                        size="sm"
                        variant="helicone"
                        checked={longTextModes.has(name)}
                        onCheckedChange={() => toggleLongText(name)}
                      />
                    </div>
                  </div>
                  {longTextModes.has(name) ? (
                    <Textarea
                      placeholder={`Enter ${variable.type} value...`}
                      value={values.get(name) ?? ""}
                      onChange={(e) => onUpdateValue(name, e.target.value)}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <Input
                      placeholder={`Enter ${variable.type} value...`}
                      value={values.get(name) ?? ""}
                      onChange={(e) => onUpdateValue(name, e.target.value)}
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