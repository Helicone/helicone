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
import { useState, useEffect, useRef } from "react";
import { Badge } from "../../../../../ui/badge";
import PromptPlayground from "../../../id/promptPlayground";
import { Input } from "../../../../../ui/input";

const InputCellRenderer: React.FC<any> = (props) => {
  const { data, value, colDef, context } = props;
  const { inputKeys, setActivePopoverCell } = context;
  const isLastInput = colDef.field === inputKeys[inputKeys.length - 1];

  return (
    <div
      className="w-full h-full flex items-center cursor-pointer text-[0.5rem]"
      onClick={() => {
        if (isLastInput && !data.dataset_row_id) {
          setActivePopoverCell({
            rowIndex: props.rowIndex,
            colId: colDef.field,
          });
        }
      }}
    >
      {value}
    </div>
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
            <span className="text-[0.5rem] font-semibold text-slate-900">
              {displayName}
            </span>
            <Badge
              variant={badgeVariant}
              className="text-[0.5rem] text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-medium hover:bg-slate-100"
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
              <PlayIcon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom">
        <PromptPlayground
          prompt={
            props.promptVersionTemplate?.helicone_template ??
            (props.hypothesis?.promptVersion?.template || "")
          }
          selectedInput={undefined}
          onSubmit={(history, model) => {
            setShowPromptPlayground(false);
          }}
          submitText="Save"
          initialModel={
            props.promptVersionTemplate?.model ||
            props.hypothesis?.promptVersion?.model ||
            ""
          }
          isPromptCreatedFromUi={true}
          defaultEditMode={false}
          editMode={false}
        />
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
        <span className="text-[0.5rem] font-semibold text-slate-900">
          {displayName}
        </span>
        <Badge
          variant={badgeVariant}
          className="text-[0.5rem] text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-medium hover:bg-slate-100"
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
      <ListBulletIcon className="h-4 w-4 text-slate-400" />
    </div>
  );
};

const PromptCellRenderer: React.FC<any> = (props) => {
  return (
    <div className="w-full h-full text-center items-center text-[0.5rem]">
      {props.value}
    </div>
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
        <span className="text-[0.5rem]">{rowNumber}</span>
      ) : (
        <Button
          variant="ghost"
          className="p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 h-[18px] w-[22px] flex items-center justify-center"
          onClick={handleRunClick}
        >
          <PlayIcon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
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
