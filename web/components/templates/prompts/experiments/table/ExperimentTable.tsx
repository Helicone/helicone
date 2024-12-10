import { Button } from "@/components/ui/button";
import HcBreadcrumb from "@/components/ui/hcBreadcrumb";
import { IslandContainer } from "@/components/ui/islandContainer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import ExperimentInputSelector from "../experimentInputSelector";
import { ExperimentRandomInputSelector } from "../experimentRandomInputSelector";
import AddColumnDialog from "./AddColumnDialog";
import AddManualRowPanel from "./AddManualRowPanel";
import { AddRowPopover } from "./components/addRowPopover";
import ExperimentTableContent from "./components/ExperimentTableContent";
import EditInputsPanel from "./EditInputsPanel";
import { useExperimentTable } from "./hooks/useExperimentTable";
import ScoresEvaluatorsConfig from "./scores/ScoresEvaluatorsConfig";
import ScoresGraphContainer from "./scores/ScoresGraphContainer";

export function ExperimentTable({
  experimentTableId,
}: {
  experimentTableId: string;
}) {
  const {
    experimentTableQuery,
    promptVersionsData,
    addExperimentTableRowInsertBatch,
    inputKeysData,
    wrapText,
  } = useExperimentTable(experimentTableId);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);
  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);
  const [rightPanel, setRightPanel] = useState<
    "edit_inputs" | "add_manual" | null
  >(null);
  const [toEditInputRecord, setToEditInputRecord] = useState<{
    id: string;
    inputKV: Record<string, string>;
  } | null>(null);
  const [showScores, setShowScores] = useState(false);

  const [
    externallySelectedForkFromPromptVersionId,
    setExternallySelectedForkFromPromptVersionId,
  ] = useState<string | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  const handleAddRowInsertBatch = useCallback(
    (
      rows: {
        inputRecordId: string;
        inputs: Record<string, string>;
      }[]
    ) => {
      const newRows = rows.map((row) => ({
        inputRecordId: row.inputRecordId,
        inputs: row.inputs,
      }));

      if (!newRows.length) return;

      addExperimentTableRowInsertBatch.mutate({
        rows: newRows,
      });
    },
    [addExperimentTableRowInsertBatch]
  );

  const queryClient = useQueryClient();

  const handleShowScoresChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        queryClient.setQueryData(["selectedScoreKey", experimentTableId], null);
        queryClient.setQueryData(["experimentScores", experimentTableId], {});

        for (const promptVersion of promptVersionsData ?? []) {
          queryClient.setQueryData(
            ["experimentScores", experimentTableId, promptVersion.id],
            {}
          );
        }
      }
      setShowScores(checked);
    },
    [queryClient, experimentTableId, promptVersionsData]
  );

  const setToEditInputRecordCallback = useCallback(
    (
      record: {
        id: string;
        inputKV: Record<string, string>;
      } | null
    ) => {
      setToEditInputRecord(record);
    },
    []
  );

  const setRightPanelCallback = useCallback(
    (panel: "edit_inputs" | "add_manual" | null) => {
      setRightPanel(panel);
    },
    []
  );

  const setIsAddColumnDialogOpenCallback = useCallback((isOpen: boolean) => {
    setIsAddColumnDialogOpen(isOpen);
  }, []);

  const setExternallySelectedForkFromPromptVersionIdCallback = useCallback(
    (id: string | null) => {
      setExternallySelectedForkFromPromptVersionId(id);
    },
    []
  );

  return (
    <>
      <div className="flex justify-between items-center py-4 pr-4">
        <IslandContainer>
          <HcBreadcrumb
            pages={[
              {
                href: "/experiments",
                name: "Experiments",
              },
              {
                href: `/experiments/${experimentTableId}`,
                name: experimentTableQuery?.name ?? "Experiment",
              },
            ]}
          />
        </IslandContainer>
        <div className="flex items-center gap-5">
          <div className="flex gap-2 items-center">
            <Switch
              size="sm"
              checked={showScores}
              onCheckedChange={(checked) => {
                handleShowScoresChange(checked);
                setShowScores(checked);
              }}
            />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Show scores
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Switch
              size="sm"
              checked={wrapText.data ?? false}
              onCheckedChange={(checked) => {
                queryClient.setQueryData(
                  ["wrapText", experimentTableId],
                  checked
                );
              }}
            />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Wrap text
            </p>
          </div>
        </div>
      </div>
      <div className="h-[calc(100vh-50px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={75}>
            <div className="flex flex-col">
              {showScores && (
                <div className="flex flex-col w-full bg-white dark:bg-neutral-950 border-y border-r border-slate-200 dark:border-slate-800">
                  {promptVersionsData && (
                    <ScoresGraphContainer
                      promptVersions={(promptVersionsData ?? []).map((pv) => ({
                        ...pv,
                        metadata: pv.metadata ?? {},
                      }))}
                      experimentId={experimentTableId}
                    />
                  )}
                  <div className="flex justify-between items-center bg-white dark:bg-neutral-950 p-2">
                    <ScoresEvaluatorsConfig experimentId={experimentTableId} />
                  </div>
                </div>
              )}
              <div
                className={clsx(
                  "max-h-[calc(100vh-90px)] overflow-y-auto overflow-x-auto bg-white dark:bg-neutral-950",
                  showScores && "max-h-[calc(100vh-90px-300px-80px)]"
                )}
              >
                <div className="min-w-fit h-full bg-white dark:bg-black rounded-sm">
                  <ExperimentTableContent
                    experimentTableId={experimentTableId}
                    setToEditInputRecord={setToEditInputRecordCallback}
                    setRightPanel={setRightPanelCallback}
                    setIsAddColumnDialogOpen={setIsAddColumnDialogOpenCallback}
                    setExternallySelectedForkFromPromptVersionId={
                      setExternallySelectedForkFromPromptVersionIdCallback
                    }
                  />
                </div>
              </div>

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start flex flex-row space-x-2 text-slate-800 mt-0 shadow-none"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add row
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full px-2 py-2">
                  <AddRowPopover
                    setPopoverOpen={setPopoverOpen}
                    setShowAddManualRow={() => setRightPanel("add_manual")}
                    setShowExperimentInputSelector={
                      setShowExperimentInputSelector
                    }
                    setShowRandomInputSelector={setShowRandomInputSelector}
                  />
                </PopoverContent>
              </Popover>

              <ExperimentRandomInputSelector
                open={showRandomInputSelector}
                setOpen={setShowRandomInputSelector}
                handleAddRows={handleAddRowInsertBatch}
                promptVersionId={
                  experimentTableQuery?.original_prompt_version ?? ""
                }
                onSuccess={async (success) => {}}
              />

              <ExperimentInputSelector
                open={showExperimentInputSelector}
                setOpen={setShowExperimentInputSelector}
                promptVersionId={
                  experimentTableQuery?.original_prompt_version ?? ""
                }
                handleAddRows={handleAddRowInsertBatch}
                onSuccess={async (success) => {}}
              />
            </div>
          </ResizablePanel>

          {/* Add right panel if needed */}
          {rightPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel minSize={25} maxSize={75}>
                <div className="h-full flex-shrink-0 flex flex-col">
                  {rightPanel === "edit_inputs" && (
                    <EditInputsPanel
                      experimentId={experimentTableId}
                      inputRecord={toEditInputRecord}
                      inputKeys={inputKeysData ?? []}
                      onClose={() => {
                        setToEditInputRecord(null);
                        setRightPanel(null);
                      }}
                    />
                  )}
                  {rightPanel === "add_manual" && (
                    <AddManualRowPanel
                      experimentId={experimentTableId}
                      inputKeys={inputKeysData ?? []}
                      onClose={() => setRightPanel(null)}
                    />
                  )}
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
        <AddColumnDialog
          isOpen={isAddColumnDialogOpen}
          onOpenChange={setIsAddColumnDialogOpen}
          experimentId={experimentTableId}
          originalColumnPromptVersionId={promptVersionsData?.[0]?.id ?? ""}
          selectedForkFromPromptVersionId={
            externallySelectedForkFromPromptVersionId ?? ""
          }
          numberOfExistingPromptVersions={
            promptVersionsData?.length ? promptVersionsData.length - 1 : 0
          }
        />
      </div>
    </>
  );
}
