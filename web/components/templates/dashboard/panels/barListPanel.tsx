import { useState } from "react";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ThemedModal from "../../../shared/themed/themedModal";
import { DataWithColor } from "./utils";

interface BarListPanelProps {
  data: DataWithColor[];
  maxValue: number;
  formatValue: (value: number) => string;
  modalTitle: string;
  modalValueLabel: string;
}

export const BarListWithTooltips = ({
  data,
  maxValue,
  formatValue,
}: {
  data: DataWithColor[];
  maxValue: number;
  formatValue: (value: number) => string;
}) => {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        {data.map((item) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <div className="relative h-8 overflow-hidden rounded">
                  {/* Background bar */}
                  <div
                    className="absolute inset-0"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        item.color === "blue"
                          ? "hsl(217, 100%, 55%)"
                          : item.color === "purple"
                            ? "hsl(271, 100%, 60%)"
                            : item.color === "cyan"
                              ? "hsl(185, 100%, 40%)"
                              : item.color === "green"
                                ? "hsl(145, 80%, 42%)"
                                : item.color === "pink"
                                  ? "hsl(330, 100%, 55%)"
                                  : item.color === "orange"
                                    ? "hsl(25, 100%, 50%)"
                                    : item.color === "yellow"
                                      ? "hsl(48, 100%, 50%)"
                                      : "hsl(217, 100%, 55%)",
                      opacity: 0.35,
                    }}
                  />
                  {/* Content on top */}
                  <div className="relative flex h-full items-center justify-between px-3">
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                    <span className="ml-3 shrink-0 text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">
                      {formatValue(item.value)}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs break-all">{item.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export const useExpandableBarList = ({
  data,
  maxValue,
  formatValue,
  modalTitle,
  modalValueLabel,
}: BarListPanelProps) => {
  const [open, setOpen] = useState(false);

  const expandButton = (
    <button
      onClick={() => {
        setOpen(true);
      }}
      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
    >
      <ArrowsPointingOutIcon className="h-4 w-4" />
    </button>
  );

  const barList = (
    <BarListWithTooltips
      data={data}
      maxValue={maxValue}
      formatValue={formatValue}
    />
  );

  const modal = (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex w-[450px] flex-col divide-y divide-gray-300 dark:divide-gray-700">
        <div className="flex flex-row items-end justify-between pb-4">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            {modalTitle}
          </h3>
          <p className="text-sm text-gray-500">{modalValueLabel}</p>
        </div>
        <div className="h-96 max-h-96 overflow-auto py-4">
          <BarListWithTooltips
            data={data}
            maxValue={maxValue}
            formatValue={formatValue}
          />
        </div>
      </div>
    </ThemedModal>
  );

  return { expandButton, barList, modal };
};
