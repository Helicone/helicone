import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPOSITE_OPTIONS, LLM_AS_A_JUDGE_OPTIONS } from "../testing/examples";
import { EvaluatorType } from "@/components/templates/evals/testing/types";

export const EvaluatorTypeDropdown: React.FC<{
  selectedOption: string;
  onOptionSelect: (option: EvaluatorType) => void;
}> = ({ selectedOption, onOptionSelect }) => {
  return (
    <>
      <div className="pb-8">
        Presets:{" "}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm_sleek">
              {selectedOption}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>LLM As a Judge</DropdownMenuLabel>
              {LLM_AS_A_JUDGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.name}
                  onClick={() => onOptionSelect(option)}
                >
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Composite</DropdownMenuLabel>
              {COMPOSITE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.name}
                  onClick={() => onOptionSelect(option)}
                >
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                RAG <span className="text-xs text-gray-500">(soon)</span>
              </DropdownMenuLabel>
              <DropdownMenuItem
                // onClick={() => onOptionSelect("ContextRecall")}
                disabled
              >
                ContextRecall
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={() => onOptionSelect("AnswerSimilarity")}
                disabled
              >
                AnswerSimilarity
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={() => onOptionSelect("SourceProperly")}
                disabled
              >
                SourceProperly
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TabsList>
        <TabsTrigger value="llm-as-a-judge">LLM-as-a-judge</TabsTrigger>
        <TabsTrigger value="python">
          Python <span className="text-xs text-gray-500 px-3"></span>
        </TabsTrigger>
        <TabsTrigger value="typescript">LastMile AutoEval </TabsTrigger>
        <TabsTrigger value="typescript" disabled>
          Typescript <span className="text-xs text-gray-500 px-3">(soon)</span>
        </TabsTrigger>
      </TabsList>
    </>
  );
};
