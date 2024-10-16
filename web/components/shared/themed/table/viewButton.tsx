import {
  CheckIcon,
  Square2StackIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { RequestViews } from "./themedTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ViewButtonProps {
  currentView: RequestViews;
  onViewChange: (value: RequestViews) => void;
}

export default function ViewButton({
  currentView,
  onViewChange,
}: ViewButtonProps) {
  return (
    <div className="hidden md:block text-right">
      <TooltipProvider>
        <Tooltip>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-700 dark:text-slate-400"
                >
                  <Square3Stack3DIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => onViewChange("table")}
                title="Switch to table view"
              >
                <div className="flex w-full items-center">
                  <TableCellsIcon className="mr-2 h-5 w-5" />
                  Table
                </div>
                {currentView === "table" && (
                  <CheckIcon className="ml-auto h-5 w-5" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onViewChange("row")}
                title="Switch to row view"
              >
                <div className="flex w-full items-center">
                  <Square2StackIcon className="mr-2 h-5 w-5" />
                  Row
                </div>
                {currentView === "row" && <CheckIcon className="ml-auto h-5 w-5" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onViewChange("card")}
                title="Switch to card view"
              >
                <div className="flex w-full items-center">
                  <Squares2X2Icon className="mr-2 h-5 w-5" />
                  Card
                </div>
                {currentView === "card" && (
                  <CheckIcon className="ml-auto h-5 w-5" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipContent>
            <p>Change view</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
