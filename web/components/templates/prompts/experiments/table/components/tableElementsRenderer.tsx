import {
  ListBulletIcon,
  PlayIcon,
  DotsHorizontalIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../../../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../../ui/popover";
import { useState, useEffect, useRef, useMemo } from "react";
import { Badge } from "../../../../../ui/badge";
import PromptPlayground from "../../../id/promptPlayground";
import { Input } from "../../../../../ui/input";
import ArrayDiffViewer from "../../../id/arrayDiffViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";

const InputCellRenderer: React.FC<any> = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    props.data.cells[props.colDef.cellRendererParams.columnId]?.value || ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine the display value
  const displayValue = inputValue || "Click to add input";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  const handleInputSubmit = () => {
    if (inputValue.trim() === "") return;

    const cell = props.data.cells[props.column.colId];

    props.context.handleUpdateExperimentCell({
      cellId: cell.cellId,
      value: inputValue.trim(),
    });

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        className="h-full w-full text-sm border-none focus:ring-0"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleInputSubmit}
        autoFocus
      />
    );
  }

  return (
    <div
      className="cursor-pointer h-full w-full px-2 flex items-center"
      onClick={() => setIsEditing(true)}
      style={{
        whiteSpace: "inherit",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: inputValue ? "inherit" : "#6B7280",
      }}
    >
      {displayValue}
    </div>
  );
};

const CustomHeaderComponent: React.FC<any> = (props) => {
  const {
    displayName,
    badgeText,
    badgeVariant,
    onRunColumn,
    onHeaderClick,
    orginalPromptTemplate,
    promptVersionId,
    originalPromptTemplate,
  } = props;

  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  const jawnClient = useJawnClient();

  // Use React Query to fetch and cache the prompt template
  const { data: promptTemplate } = useQuery(
    ["promptTemplate", promptVersionId],
    async () => {
      if (!props.context.orgId || !promptVersionId) return null;

      const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
        params: {
          path: {
            promptVersionId: promptVersionId,
          },
        },
      });
      return res.data?.data;
    },
    {
      enabled:
        !!props.context.orgId && !!promptVersionId && showPromptPlayground,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const handleHeaderClick = (e: React.MouseEvent) => {
    setShowPromptPlayground(true);
  };

  const handleRunClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRunColumn) {
      await onRunColumn(props.column.colId);
    }
  };

  //TODO: FIX!!!

  const hasDiff = useMemo(() => {
    return (
      (promptTemplate?.helicone_template as any)?.messages &&
      (originalPromptTemplate?.helicone_template as any)?.messages
    );
  }, [promptTemplate, originalPromptTemplate]);

  return (
    <Popover open={showPromptPlayground} onOpenChange={setShowPromptPlayground}>
      <PopoverTrigger asChild>
        <div
          className="flex items-center justify-between w-full h-full pl-2 cursor-pointer"
          onClick={handleHeaderClick}
        >
          <div className="flex items-center space-x-2">
            <span className="text-md font-semibold text-slate-900">
              {displayName}
            </span>
            <Badge
              variant={badgeVariant}
              className="text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-medium hover:bg-slate-100"
            >
              {badgeText}
            </Badge>
          </div>
          {onRunColumn && (
            <Button
              variant="ghost"
              className="ml-2 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 h-[22px] w-[24px] flex items-center justify-center"
              onClick={handleRunClick}
            >
              <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom">
        {hasDiff ? (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList
              className="w-full flex justify-end rounded-none"
              variant={"secondary"}
            >
              <TabsTrigger value="diff">Diff</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="diff">
              <ArrayDiffViewer
                origin={
                  originalPromptTemplate?.helicone_template?.messages ?? []
                }
                target={
                  (promptTemplate?.helicone_template as any)?.messages ?? []
                }
              />
            </TabsContent>
            <TabsContent value="preview">
              <PromptPlayground
                prompt={
                  promptTemplate?.helicone_template ??
                  (props.hypothesis?.promptVersion?.template || "")
                }
                selectedInput={undefined}
                onSubmit={(history, model) => {
                  setShowPromptPlayground(false);
                }}
                submitText="Save"
                initialModel={
                  promptTemplate?.model ||
                  props.hypothesis?.promptVersion?.model ||
                  ""
                }
                isPromptCreatedFromUi={false}
                defaultEditMode={false}
                editMode={false}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <PromptPlayground
            prompt={
              promptTemplate?.helicone_template ??
              (props.hypothesis?.promptVersion?.template || "")
            }
            selectedInput={undefined}
            onSubmit={(history, model) => {
              setShowPromptPlayground(false);
            }}
            submitText="Save"
            initialModel={
              promptTemplate?.model ||
              props.hypothesis?.promptVersion?.model ||
              ""
            }
            isPromptCreatedFromUi={false}
            defaultEditMode={false}
            editMode={false}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

const InputsHeaderComponent: React.FC<any> = (props) => {
  const { displayName, badgeText, badgeVariant, onRunColumn, onHeaderClick } =
    props;

  return (
    <div className="flex items-center justify-between w-full h-full pl-2 cursor-pointer">
      <div className="flex items-center space-x-2">
        <span className="text-md font-semibold text-slate-900">
          {displayName}
        </span>
        <Badge
          variant={badgeVariant}
          className="text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-medium hover:bg-slate-100"
        >
          {badgeText}
        </Badge>
      </div>
    </div>
  );
};

const RowNumberHeaderComponent: React.FC<any> = (props) => {
  return (
    <div className="flex-1 text-center items-center space-x-2 justify-center ml-1">
      <ListBulletIcon className="h-5 w-5 text-slate-400" />
    </div>
  );
};

const PromptCellRenderer: React.FC<any> = (props) => {
  return (
    <div className="w-full h-full text-center items-center">{props.value}</div>
  );
};

const RowNumberCellRenderer: React.FC<any> = (props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const rowNumber =
    props.node?.rowIndex !== undefined
      ? props.node.rowIndex + 1 // Assuming 0-based index, adjust as needed
      : "N/A";

  const handleRunClick = () => {
    const rowIndex = props.node.rowIndex;
    props.context.handleRunRow(rowIndex);
    setPopoverOpen(false); // Close popover after action
  };

  const handleDeleteClick = () => {
    const rowIndex = props.node.rowIndex;
    console.log("handleDeleteClick", rowIndex);
    return;
    props.context.handleDeleteRow(rowIndex);
    setPopoverOpen(false); // Close popover after action
  };

  return (
    <div className="w-full h-full">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild className="w-full h-full">
          <Button
            variant="ghost"
            className="flex items-center justify-center w-full h-full cursor-pointer"
            onClick={() => setPopoverOpen(!popoverOpen)}
          >
            {rowNumber}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="p-2 w-32">
          <div className="flex flex-col items-center justify-start px-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-start"
              onClick={handleRunClick}
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Run
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-start"
              onClick={handleDeleteClick}
            >
              <TrashIcon className="w-4 h-4 mr-2 text-red-500" />
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export {
  InputCellRenderer,
  CustomHeaderComponent,
  RowNumberHeaderComponent,
  PromptCellRenderer,
  RowNumberCellRenderer,
  InputsHeaderComponent,
};
