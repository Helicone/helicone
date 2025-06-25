import { Small } from "@/components/ui/typography";
import ModelPill from "@/components/templates/requests/modelPill";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { PromptWithVersions } from "@/services/hooks/prompts";

interface PromptDetailsProps {
  promptWithVersions: PromptWithVersions | null;
}

const PromptDetails = ({ promptWithVersions }: PromptDetailsProps) => {
  const [selectedVersion, setSelectedVersion] = useState<string>("All");

  if (!promptWithVersions) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Small className="text-muted-foreground">Select a prompt to view details</Small>
      </div>
    );
  }

  const { prompt, productionVersion, majorVersions } = promptWithVersions;

  const versionOptions = ["All"];
  for (let i = 0; i <= majorVersions; i++) {
    versionOptions.push(`v${i}`);
  }

  const versionDisplay = productionVersion.minor_version === 0 
    ? `v${productionVersion.major_version}` 
    : `v${productionVersion.major_version}.${productionVersion.minor_version}`;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b border-border bg-background">
        <div className="mb-2">
          <span className="font-semibold text-foreground">{prompt.name}</span>
          <div className="text-xs text-muted-foreground mt-1">id: {prompt.id}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            {versionDisplay}
          </span>
          <ModelPill model={productionVersion.model} />
        </div>
      </div>

      <div className="p-4 border-b border-border bg-background">
        <div className="flex flex-col gap-2">
          <Small className="font-medium text-foreground">Version</Small>
          <Select value={selectedVersion} onValueChange={setSelectedVersion}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {versionOptions.map((version) => (
                <SelectItem key={version} value={version}>
                  {version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default PromptDetails;
