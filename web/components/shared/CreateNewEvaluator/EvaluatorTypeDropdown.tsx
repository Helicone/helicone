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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvaluatorConfigFormPreset } from "./EvaluatorConfigForm";

export const LLM_AS_A_JUDGE_OPTIONS: {
  name: string;

  preset: EvaluatorConfigFormPreset;
}[] = [
  {
    name: "Humor",
    preset: {
      choiceScores: [
        { score: 1, description: "Not funny" },
        { score: 2, description: "Slightly funny" },
        { score: 3, description: "Funny" },
        { score: 4, description: "Very funny" },
        { score: 5, description: "Hilarious" },
      ],
      expectedValueType: "choice",
      description: "Check if the response is funny",
      name: "Humor",
      rangeMin: 1,
      rangeMax: 100,
    },
  },
  {
    name: "SQL",
    preset: {
      expectedValueType: "boolean",
      description: "Check if the response is a valid SQL query",
      name: "SQL",
      rangeMin: 1,
      rangeMax: 5,
    },
  },
  {
    name: "Moderation",
    preset: {
      expectedValueType: "boolean",
      description: "Check if the response is appropriate",
      name: "Moderation",
      rangeMin: 1,
      rangeMax: 5,
    },
  },
  {
    name: "Language - English",
    preset: {
      expectedValueType: "boolean",
      description: "Check if the response is in English",
      name: "Language - English",
      rangeMin: 1,
      rangeMax: 5,
    },
  },
];

export const EvaluatorTypeDropdown: React.FC<{
  selectedOption: string;
  onOptionSelect: (option: (typeof LLM_AS_A_JUDGE_OPTIONS)[number]) => void;
}> = ({ selectedOption, onOptionSelect }) => {
  return (
    <Tabs defaultValue="llm-as-a-judge">
      <TabsList>
        <TabsTrigger value="llm-as-a-judge">LLM-as-a-judge</TabsTrigger>
        <TabsTrigger value="python" disabled>
          Python <span className="text-xs text-gray-500 px-3">(soon)</span>
        </TabsTrigger>
        <TabsTrigger value="typescript" disabled>
          Typescript <span className="text-xs text-gray-500 px-3">(soon)</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="llm-as-a-judge">
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
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                Composite <span className="text-xs text-gray-500">(soon)</span>
              </DropdownMenuLabel>
              <DropdownMenuItem
                // onClick={() => onOptionSelect("StringContains")}
                disabled
              >
                StringContains
              </DropdownMenuItem>
              <DropdownMenuItem
                // onClick={() => onOptionSelect("ValidJSON")}
                disabled
              >
                ValidJSON
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TabsContent>
      <TabsContent value="python"></TabsContent>
    </Tabs>
  );
};
