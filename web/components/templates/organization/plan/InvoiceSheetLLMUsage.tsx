import { InfoIcon } from "lucide-react";
import {
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
    <div className="flex justify-between items-center text-sm">
      <div className="flex gap-1 items-center">
        <span>{item.model}</span>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="w-3 h-3 text-slate-500" />
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-center">
              <span className="font-medium mr-3">Completion Tokens:</span>
              <span>{item.completion_tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium mr-3">Prompt Tokens:</span>
              <span>{item.prompt_tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium mr-3">
                Cost/1K Completion Tokens:
              </span>
              <span>
                {formatCurrency(item.totalCost.completion_token * 1000)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium mr-3">Cost/1K Prompt Tokens:</span>
              <span>{formatCurrency(item.totalCost.prompt_token * 1000)}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <span>{formatCurrency(item.amount)}</span>
    </div>
  );
};
