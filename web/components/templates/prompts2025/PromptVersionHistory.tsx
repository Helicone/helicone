import type { PromptWithVersions } from "@/services/hooks/prompts";
import PromptVersionCard from "./PromptVersionCard";

interface PromptVersionHistoryProps {
  promptWithVersions: PromptWithVersions;
  onSetProductionVersion: (promptId: string, promptVersionId: string) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
}

const PromptVersionHistory = ({
  promptWithVersions,
  onSetProductionVersion,
  onOpenPromptVersion,
}: PromptVersionHistoryProps) => {
  const { versions, productionVersion } = promptWithVersions;

  return (
    <div className="w-full h-full flex flex-col">
      {versions.map((version) => (
        <PromptVersionCard
          key={version.id}
          version={version}
          isProductionVersion={version.id === productionVersion.id}
          onSetProductionVersion={onSetProductionVersion}
          onOpenPromptVersion={onOpenPromptVersion}
        />
      ))}
    </div>
  );
};

export default PromptVersionHistory;
