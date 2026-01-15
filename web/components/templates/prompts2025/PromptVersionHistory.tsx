import type { PromptWithVersions } from "@/services/hooks/prompts";
import PromptVersionCard from "./PromptVersionCard";

interface PromptVersionHistoryProps {
  promptWithVersions: PromptWithVersions;
  onSetEnvironment: (
    promptId: string,
    promptVersionId: string,
    environment: string,
  ) => void;
  onRemoveEnvironment: (
    promptId: string,
    promptVersionId: string,
    environment: string,
  ) => void;
  onOpenPromptVersion: (promptVersionId: string) => void;
  onDeletePromptVersion: (promptVersionId: string) => void;
}

const PromptVersionHistory = ({
  promptWithVersions,
  onSetEnvironment,
  onRemoveEnvironment,
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
          onSetEnvironment={onSetEnvironment}
          onRemoveEnvironment={onRemoveEnvironment}
          onOpenPromptVersion={onOpenPromptVersion}
          onDeletePromptVersion={onDeletePromptVersion}
        />
      ))}
    </div>
  );
};

export default PromptVersionHistory;
