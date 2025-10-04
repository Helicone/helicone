import { InfoIcon } from "lucide-react";
import {
import React from "react";
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LLMUsageItemProps {
  item: {
    model: string;
    amount: number;
    completion_tokens: number;
    prompt_tokens: number;
    totalCost: {
      completion_token: number;
      prompt_token: number;
    };
  };
  formatCurrency: (amount: number) => string;
}

export const LLMUsageItem: React.FC<LLMUsageItemProps> = ({
  item,
  formatCurrency,
}) => {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1">
        <span>{item.model}</span>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="h-3 w-3 text-slate-500" />
          </TooltipTrigger>
          <TooltipContent className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="mr-3 font-medium">Completion Tokens:</span>
              <span>{item.completion_tokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="mr-3 font-medium">Prompt Tokens:</span>
              <span>{item.prompt_tokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="mr-3 font-medium">
                Cost/1K Completion Tokens:
              </span>
              <span>
                {formatCurrency(item.totalCost.completion_token * 1000)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="mr-3 font-medium">Cost/1K Prompt Tokens:</span>
              <span>{formatCurrency(item.totalCost.prompt_token * 1000)}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <span>{formatCurrency(item.amount)}</span>
    </div>
  );
};
