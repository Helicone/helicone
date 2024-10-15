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

export const EvaluatorTypeDropdown: React.FC<{
  selectedOption: string;
  onOptionSelect: (option: string) => void;
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
              <DropdownMenuItem onClick={() => onOptionSelect("Humor")}>
                Humor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("SQL")}>
                SQL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("Moderation")}>
                Moderation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("Language")}>
                Language
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("Summary")}>
                Summary
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>RAG</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onOptionSelect("ContextRecall")}>
                ContextRecall
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOptionSelect("AnswerSimilarity")}
              >
                AnswerSimilarity
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOptionSelect("SourceProperly")}
              >
                SourceProperly
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Composite</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onOptionSelect("StringContains")}
              >
                StringContains
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("ValidJSON")}>
                ValidJSON
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TabsContent>
      <TabsContent value="python">
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
              <DropdownMenuItem onClick={() => onOptionSelect("Humor")}>
                Humor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("SQL")}>
                SQL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("Moderation")}>
                Moderation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("Language")}>
                Language
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("Summary")}>
                Summary
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>RAG</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onOptionSelect("ContextRecall")}>
                ContextRecall
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOptionSelect("AnswerSimilarity")}
              >
                AnswerSimilarity
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOptionSelect("SourceProperly")}
              >
                SourceProperly
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Composite</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onOptionSelect("StringContains")}
              >
                StringContains
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOptionSelect("ValidJSON")}>
                ValidJSON
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TabsContent>
    </Tabs>
  );
};
