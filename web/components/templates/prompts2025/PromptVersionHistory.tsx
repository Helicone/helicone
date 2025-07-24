import type { PromptWithVersions } from "@/services/hooks/prompts";
import PromptVersionCard from "./PromptVersionCard";

interface PromptVersionHistoryProps {
  promptWithVersions: PromptWithVersions;
  onSetProductionVersion: (promptId: string, promptVersionId: string) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
}

const PromptVersionHistory = ({
  promptWithVersions,
  onSetProductionVersion,
  onOpenPromptVersion,
  onDeletePromptVersion,
}: PromptVersionHistoryProps) => {
  const { versions, productionVersion } = promptWithVersions;

  return (
    <div className="flex h-full w-full flex-col">
      {versions.map((version) => (
        <PromptVersionCard
          key={version.id}
          version={version}
          isProductionVersion={version.id === productionVersion.id}
          onSetProductionVersion={onSetProductionVersion}
          onOpenPromptVersion={onOpenPromptVersion}
          onDeletePromptVersion={onDeletePromptVersion}
        />
      ))}
    </div>
  );
};

export default PromptVersionHistory;
