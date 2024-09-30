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
import { useState } from "react";
import { Badge } from "../../../../../ui/badge";
import PromptPlayground from "../../../id/promptPlayground";

const InputCellRenderer: React.FC<any> = (props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Determine the display value
  const displayValue =
    props.value || (props.index == 0 ? "Click to add input" : "");

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className="cursor-pointer"
          style={{
            whiteSpace: "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: props.value ? "inherit" : "#6B7280", // Tailwind Gray-500
            minHeight: "20px", // Ensure the div has height even when empty
          }}
        >
          {displayValue}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-0">
        <h2 className="text-sm w-full font-semibold px-2 pt-2">
          Enter manually, or:
        </h2>
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
  const { displayName, badgeText, badgeVariant, onRunColumn, onHeaderClick } =
    props;
  const [showPromptPlayground, setShowPromptPlayground] = useState(false);

  const handleHeaderClick = (e: React.MouseEvent) => {
    setShowPromptPlayground(true);
  };

  const handleRunClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRunColumn) {
      onRunColumn(props.column.colId);
    }
  };

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
        <PromptPlayground
          prompt={props.hypothesis?.promptVersion?.template || ""}
          selectedInput={undefined}
          onSubmit={(history, model) => {
            console.log("Submitted:", history, model);
            setShowPromptPlayground(false);
          }}
          submitText="Save"
          initialModel={props.hypothesis?.promptVersion?.model || ""}
          isPromptCreatedFromUi={true}
          defaultEditMode={false}
        />
      </PopoverContent>
    </Popover>
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
    const hypothesesToRun = props.context.hypothesesToRun; // Get the hypotheses IDs to run
    const datasetRowId = props.data.dataset_row_id; // Get the dataset row ID

    if (!datasetRowId || !hypothesesToRun || hypothesesToRun.length === 0) {
      return;
    }

    // Run each hypothesis for this dataset row
    hypothesesToRun.forEach((hypothesisId: string) => {
      props.context.handleRunHypothesis(hypothesisId, [datasetRowId]);
    });
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
};
