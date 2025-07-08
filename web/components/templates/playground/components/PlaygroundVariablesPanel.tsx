import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TemplateVariable } from "@helicone-package/prompts/types";

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
  return (
    <ScrollArea className="w-full h-full">
      <div className="flex flex-col h-full">
        <Card className="flex-1 rounded-none border-0 border-t">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Template Variables</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {variables.size === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p className="text-sm">No template variables detected</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {Array.from(variables.entries()).map(([name, variable]) => (
                  <Card key={name} className="border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>{name}</span>
                        <span className="text-xs text-muted-foreground">Type: {variable.type}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        placeholder={`Enter ${variable.type} value...`}
                        value={values.get(name) ?? ""}
                        onChange={(e) => onUpdateValue(name, e.target.value)}
                      />
                      <div className="mt-2 text-xs text-muted-foreground">
                        Template: {variable.raw}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default PlaygroundVariablesPanel; 