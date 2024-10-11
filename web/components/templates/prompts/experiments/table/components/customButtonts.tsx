import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../../ui/dropdown-menu";
import { useState } from "react";
import { Check } from "lucide-react";
import { Switch } from "../../../../../ui/switch";
import { InfoBox } from "../../../../../ui/helicone/infoBox";
import ProviderKeySelector from "../providerKeySelector";

const ColumnsDropdown: React.FC<{
  wrapText: boolean;
  setWrapText: (wrap: boolean) => void;
  columnView: "all" | "inputs" | "outputs";
  setColumnView: (view: "all" | "inputs" | "outputs") => void;
}> = ({ wrapText, setWrapText, columnView, setColumnView }) => {
  const [combineInputColumns, setCombineInputColumns] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4 text-slate-700" />
          <ChevronDownIcon className="h-4 w-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setColumnView("all");
            }}
          >
            {columnView === "all" && <Check className="h-4 w-4 mr-2" />}
            <span className="flex-1">Show all</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setColumnView("inputs");
            }}
          >
            {columnView === "inputs" && <Check className="h-4 w-4 mr-2" />}
            <span className="flex-1">Show inputs only</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setColumnView("outputs");
            }}
          >
            {columnView === "outputs" && <Check className="h-4 w-4 mr-2" />}
            <span className="flex-1">Show outputs only</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Views</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Switch
              checked={combineInputColumns}
              onClick={(event) => event.stopPropagation()}
              onCheckedChange={setCombineInputColumns}
              className="mr-2"
            />
            <span className="flex-1">Combine input columns</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Switch
              checked={wrapText}
              onClick={(event) => event.stopPropagation()}
              onCheckedChange={setWrapText}
              className="mr-2"
            />
            <span className="flex-1">Wrap text</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ProviderKeyDropdown: React.FC<{
  providerKey: string | null;
  setProviderKey: (key: string) => void;
}> = ({ providerKey, setProviderKey }) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1"
        >
          <Cog6ToothIcon className="h-4 w-4 mr-2 text-slate-700" />
          {!providerKey && (
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-700" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-w-[320px]"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        align="end"
      >
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Cog6ToothIcon className="h-6 w-6 mr-2" />
          <span className="text-base font-medium">Settings</span>
        </DropdownMenuLabel>
        {!providerKey && (
          <InfoBox variant="warning" className="p-2 ml-2">
            <p className="text-sm font-medium flex gap-2">
              <b>
                Please select a provider key to run experiments. You can change
                your mind at any time.
              </b>
            </p>
          </InfoBox>
        )}

        <div className="p-2">
          <ProviderKeySelector
            variant="basic"
            setProviderKeyCallback={(key) => {
              setProviderKey(key);
              // Don't close the dropdown
              // setOpen(false);
            }}
            defaultProviderKey={providerKey}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ColumnsDropdown, ProviderKeyDropdown };
