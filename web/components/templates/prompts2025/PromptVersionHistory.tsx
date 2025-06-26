import type { PromptWithVersions } from "@/services/hooks/prompts";
import PromptVersionCard from "./PromptVersionCard";

interface PromptVersionHistoryProps {
  promptWithVersions: PromptWithVersions;
}

const PromptVersionHistory = ({
  promptWithVersions,
}: PromptVersionHistoryProps) => {
  const { versions, productionVersion } = promptWithVersions;

  return (
    <div className="w-full h-full flex flex-col">
      {versions.map((version) => (
        <PromptVersionCard
          key={version.id}
          version={version}
          isProductionVersion={version.id === productionVersion.id}
        />
      ))}
    </div>
  );
};

export default PromptVersionHistory;
