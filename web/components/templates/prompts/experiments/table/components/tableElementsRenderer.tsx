import {
  FolderIcon,
  ListBulletIcon,
  PlayIcon,
  TableCellsIcon,
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
import { Dices } from "lucide-react";
import ArrayDiffViewer from "../../../id/arrayDiffViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";

const InputCellRenderer: React.FC<any> = (props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(props.value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const inputColumns = props.context.experimentTableData?.columns.filter(
    (column: any) => column.columnType === "input"
  );

  // Determine the display value
  const displayValue = inputValue || "Click to add input";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    props.context.handleInputChange(
      props.column.colDef.headerComponentParams.columnName,
      newValue,
      props.column.colId,
      props.node.rowIndex
    );
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  const handleInputSubmit = () => {
    if (inputValue.trim() === "") {
      // Don't submit if the value is empty
      return;
    }

    setPopoverOpen(false);

    // Find current column index in input columns
    const currentColumnIndex = inputColumns.findIndex(
      (col: any) => col.id === props.column.colId
    );
    const nextInputColumn = inputColumns[currentColumnIndex + 1];

    if (nextInputColumn) {
      props.context.setActivePopoverCell({
        rowIndex: props.node.rowIndex,
        colId: nextInputColumn.id,
      });
    } else {
      // This is the last input column
      props.context.handleLastInputSubmit(props.node.rowIndex);
    }
  };

  useEffect(() => {
    if (popoverOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [popoverOpen]);

  useEffect(() => {
    const isActiveCell =
      props.context.activePopoverCell?.rowIndex === props.node.rowIndex &&
      props.context.activePopoverCell?.colId === props.column.colId;
    if (isActiveCell) {
      setPopoverOpen(true);
    } else {
      setPopoverOpen(false);
    }
  }, [
    props.context.activePopoverCell,
    props.node.rowIndex,
    props.column.colId,
  ]);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className="cursor-pointer"
          style={{
            whiteSpace: "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: inputValue ? "inherit" : "#6B7280",
            minHeight: "20px",
          }}
        >
          {displayValue}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-0">
        <Input
          ref={inputRef}
          className="text-sm w-full font-semibold px-2 pt-2 border-none"
          placeholder="Enter manually, or:"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputSubmit}
        />

        <div className="flex flex-col space-y-2 p-2 items-start justify-start">
          <Button
            onClick={() => {
              setPopoverOpen(false);
              props.context.setShowExperimentInputSelector(true);
            }}
            className="h-8 w-full flex items-center justify-start"
            variant="ghost"
          >
            <TableCellsIcon className="inline h-4 w-4 mr-2" />
            Select an input set
          </Button>
          <Button
            onClick={() => {
              setPopoverOpen(false);
              props.context.setShowRandomInputSelector(true);
            }}
            className="h-8 w-full flex items-center justify-start"
            variant="ghost"
          >
            <Dices className="inline h-4 w-4 mr-2" />
            Random prod
          </Button>
          <Button
            className="w-full h-8 flex items-center justify-start"
            variant="ghost"
          >
            <FolderIcon className="inline h-4 w-4 mr-2" />
            Select a dataset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
          <Tabs defaultValue="diff" className="w-full">
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
  const [hovered, setHovered] = useState(false);

  const rowNumber =
    props.node?.rowIndex !== undefined
      ? (props.node?.rowIndex || 0) + 1
      : "N/A";

  const handleRunClick = () => {
    const rowIndex = props.node.rowIndex;
    props.context.handleRunRow(rowIndex);
  };

  return (
    <div
      className="flex items-center justify-center w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!hovered ? (
        <span>{rowNumber}</span>
      ) : (
        <Button
          variant="ghost"
          className="p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 h-[22px] w-[26px] flex items-center justify-center"
          onClick={handleRunClick}
        >
          <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </Button>
      )}
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
