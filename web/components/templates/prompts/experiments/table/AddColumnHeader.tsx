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
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";

interface AddColumnHeaderProps {
  promptVersionId: string;
  experimentId: string;
  selectedProviderKey: string | null;
  handleAddColumn: (
    columnName: string,
    columnType: "experiment" | "input" | "output",
    hypothesisId?: string,
    promptVersionId?: string,
    promptVariables?: string[],
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
  disabled?: boolean;
}

const AddColumnHeader: React.FC<AddColumnHeaderProps> = ({
  promptVersionId: _promptVersionId,
  experimentId,
  selectedProviderKey: _selectedProviderKey,
  handleAddColumn: _handleAddColumn,
  wrapText: _wrapText,
  originalColumnPromptVersionId,
  experimentPromptVersions,
  numberOfExistingPromptVersions = 0,
  disabled = false,
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

  const buttonElement = (
    <Button variant="ghost" className="text-slate-900 dark:text-slate-100">
      <PlusIcon className="h-5 w-5 text-slate-700 dark:text-slate-100" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-100">
        Add Prompt
      </span>
    </Button>
  );

  return (
    <>
      {disabled ? (
        <FreeTierLimitWrapper
          feature="experiments"
          subfeature="variants"
          itemCount={experimentPromptVersions.length}
        >
          {buttonElement}
        </FreeTierLimitWrapper>
      ) : (
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>{buttonElement}</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="text-sm font-normal leading-[140%] text-slate-500">
              Fork new prompt from
            </DropdownMenuLabel>
            {experimentPromptVersions?.map((pv) => (
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
      )}
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
