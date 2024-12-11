import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddColumnDialog from "./AddColumnDialog";
import { OnboardingPopover } from "@/components/templates/onboarding/OnboardingPopover";

interface AddColumnHeaderProps {
  promptVersionId: string;
  experimentId: string;
  selectedProviderKey: string | null;
  handleAddColumn: (
    columnName: string,
    columnType: "experiment" | "input" | "output",
    hypothesisId?: string,
    promptVersionId?: string,
    promptVariables?: string[]
  ) => Promise<void>;
  wrapText: boolean;
  originalColumnPromptVersionId: string;
  experimentPromptVersions: {
    id: string;
    metadata: Record<string, any>;
    major_version: number;
    minor_version: number;
  }[];
  numberOfExistingPromptVersions?: number;
}

const AddColumnHeader: React.FC<AddColumnHeaderProps> = ({
  promptVersionId,
  experimentId,
  selectedProviderKey,
  handleAddColumn,
  wrapText,
  originalColumnPromptVersionId,
  experimentPromptVersions,
  numberOfExistingPromptVersions = 0,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedForkFromPromptVersionId, setSelectedForkFromPromptVersionId] =
    useState<string | null>(null);
  useEffect(() => {
    if (!isAddDialogOpen) {
      setSelectedForkFromPromptVersionId(null);
    }
  }, [isAddDialogOpen]);

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <OnboardingPopover
            popoverContentProps={{
              onboardingStep: "EXPERIMENTS_ADD",
              align: "start",
              alignOffset: 10,
              nextOverride: () => {
                setSelectedForkFromPromptVersionId(
                  experimentPromptVersions?.[0].id
                );
                setIsAddDialogOpen(true);
                setIsDropdownOpen(false);
              },
              delayMs: 1000,
            }}
          >
            <Button
              variant="ghost"
              className="text-slate-900 dark:text-slate-100"
            >
              <PlusIcon className="w-5 h-5 text-slate-700 dark:text-slate-100" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-100">
                Add Column
              </span>
            </Button>
          </OnboardingPopover>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="font-normal text-sm text-slate-500 leading-[140%]">
            Fork new prompt from
          </DropdownMenuLabel>
          {experimentPromptVersions?.map((pv, i) => (
            <DropdownMenuItem
              key={pv.id}
              onSelect={(e) => {
                e.preventDefault();
                setSelectedForkFromPromptVersionId(pv.id);
                setIsAddDialogOpen(true);
                setIsDropdownOpen(false);
              }}
            >
              {(pv?.metadata?.label as string) ??
                `v${pv?.major_version}.${pv?.minor_version}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <AddColumnDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        selectedForkFromPromptVersionId={selectedForkFromPromptVersionId}
        experimentId={experimentId}
        originalColumnPromptVersionId={originalColumnPromptVersionId}
        numberOfExistingPromptVersions={numberOfExistingPromptVersions}
      />
    </>
  );
};

export default AddColumnHeader;
