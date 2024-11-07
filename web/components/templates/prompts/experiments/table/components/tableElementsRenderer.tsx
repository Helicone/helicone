import {
  ListBulletIcon,
  PlayIcon,
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
import React from "react";

interface InputEntry {
  cellId: string;
  key: string;
  value: string;
}

interface InputCellRendererProps {
  value?: InputEntry[];
  data: any; // The full row data
  context: any; // Grid context
  node: any; // Grid node
}

const InputCellRenderer: React.FC<InputCellRendererProps> = (props) => {
  const [isEditing, setIsEditing] = useState(false);

  console.log("props", props);
  // Initialize inputs state with the value from props
  const [inputs, setInputs] = useState<InputEntry[]>(
    props?.data?.cells?.inputs?.value || []
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (index: number, newValue: string) => {
    setInputs((prevInputs) => {
      const updatedInputs = [...prevInputs];
      updatedInputs[index] = {
        ...updatedInputs[index],
        value: newValue,
      };
      return updatedInputs;
    });
  };

  const handleInputSubmit = () => {
    // Pass the updated inputs to the context's update function
    if (props.context && props.context.handleUpdateExperimentCell) {
      inputs.forEach((input) => {
        props.context.handleUpdateExperimentCell({
          cellId: input.cellId,
          value: input.value.trim(),
        });
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleInputSubmit();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && containerRef.current) {
      // Focus on the first input field
      const inputElements = containerRef.current.querySelectorAll("input");
      if (inputElements.length > 0) {
        (inputElements[0] as HTMLElement).focus();
      }
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={containerRef} className="p-2">
        {inputs.map((inputEntry, index) => (
          <div key={inputEntry.cellId} className="flex items-center mb-1">
            <label className="mr-2 font-semibold text-sm">
              {inputEntry.key}:
            </label>
            <Input
              className="h-8 text-sm flex-1"
              value={inputEntry.value}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer"
      onClick={() => setIsEditing(true)}
      style={{
        whiteSpace: "normal",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {inputs.map((inputEntry) => (
        <div key={inputEntry.cellId}>
          <span className="mr-1 font-semibold">{inputEntry.key}:</span>
          <span>{inputEntry.value}</span>
        </div>
      ))}
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
  const dataRowIndex = props.data.rowIndex;
  const gridRowIndex =
    props.node.rowIndex !== undefined ? props.node.rowIndex + 1 : "N/A";

  const handleRunClick = () => {
    props.context.handleRunRow(dataRowIndex);
    setPopoverOpen(false); // Close popover after action
  };

  const handleDeleteClick = () => {
    props.context.handleDeleteRow(dataRowIndex);
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
            {gridRowIndex}
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
