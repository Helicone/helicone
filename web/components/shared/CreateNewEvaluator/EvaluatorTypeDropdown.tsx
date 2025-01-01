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
import { LLMEvaluatorConfigFormPreset } from "./LLMEvaluatorConfigForm";
import { TestInput } from "./types";

export type LLMOption = {
  name: string;
  preset: LLMEvaluatorConfigFormPreset;
  _type: "llm";
};

export type CompositeOption = {
  name: string;
  _type: "composite";
  preset: {
    code: string;
    description: string;
    testInput: TestInput;
  };
};

const exTestInput: TestInput = {
  inputBody: JSON.stringify(
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            {
              text: `Hello my name is John`,
              type: "text",
            },
          ],
        },
      ],
    },
    null,
    4
  ),
  outputBody: JSON.stringify(
    {
      id: "chatcmpl-AijHFxqZKjpyWX5A6h06Wkhvrt3DB",
      object: "chat.completion",
      created: 1735223841,
      model: "gpt-3.5-turbo-0125",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello world! I am an assistant",
            refusal: null,
          },
          logprobs: null,
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 2222,
        completion_tokens: 116,
        total_tokens: 2338,
        prompt_tokens_details: {
          cached_tokens: 0,
          audio_tokens: 0,
        },
        completion_tokens_details: {
          reasoning_tokens: 0,
          audio_tokens: 0,
          accepted_prediction_tokens: 0,
          rejected_prediction_tokens: 0,
        },
      },
      system_fingerprint: null,
    },
    null,
    4
  ),
  inputs: {
    inputs: {
      name: "John",
    },
    autoInputs: {},
  },
  prompt: JSON.stringify(
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            {
              text: `Hello my name is <helicone-prompt-input key="name" />`,
              type: "text",
            },
          ],
        },
      ],
    },
    null,
    4
  ),
};

export const LLM_AS_A_JUDGE_OPTIONS: LLMOption[] = [
  {
    name: "Response Quality",
    preset: {
      model: "gpt-4o-mini",
      choiceScores: [
        { score: 1, description: "Incorrect or irrelevant" },
        { score: 2, description: "Partially correct but incomplete" },
        { score: 3, description: "Correct but could be better" },
        { score: 4, description: "Very good and comprehensive" },
        { score: 5, description: "Excellent, accurate and thorough" },
      ],
      expectedValueType: "choice",
      description: "Evaluate the overall quality and accuracy of the response",
      name: "Response Quality",
      rangeMin: 1,
      rangeMax: 5,
      testInput: exTestInput,
    },
    _type: "llm",
  },
  {
    name: "Humor",
    preset: {
      model: "gpt-4o-mini",
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
      testInput: exTestInput,
    },
    _type: "llm",
  },
  {
    name: "SQL",
    preset: {
      model: "gpt-4o-mini",
      expectedValueType: "boolean",
      description: "Check if the response is a valid SQL query",
      name: "SQL",
      rangeMin: 1,
      rangeMax: 5,
      testInput: exTestInput,
    },
    _type: "llm",
  },
  {
    name: "Moderation",
    preset: {
      model: "gpt-4o-mini",
      expectedValueType: "boolean",
      description: "Check if the response is appropriate",
      name: "Moderation",
      rangeMin: 1,
      rangeMax: 5,
      testInput: exTestInput,
    },
    _type: "llm",
  },
  {
    name: "Language - English",
    preset: {
      model: "gpt-4o-mini",
      expectedValueType: "boolean",
      description: "Check if the response is in English",
      name: "Language - English",
      rangeMin: 1,
      rangeMax: 5,
      testInput: exTestInput,
    },
    _type: "llm",
  },
];

export const COMPOSITE_OPTIONS: CompositeOption[] = [
  {
    name: "String Contains",
    _type: "composite",
    preset: {
      code: `import os
import os
import json

class HeliconeEvaluator:
    @staticmethod
    def request():
        with open(f"/tmp/{HELICONE_EXECUTION_ID}/request.json", "r") as f:
            return json.load(f)
    
    @staticmethod
    def response():
        with open(f"/tmp/{HELICONE_EXECUTION_ID}/response.json", "r") as f:
            return json.load(f)

    @staticmethod
    def output(output: int | bool):
        if isinstance(output, bool) or isinstance(output, int):
            with open(f"/tmp/{HELICONE_EXECUTION_ID}/output.txt", "w") as f:
                f.write(str(output))
        else:
            raise ValueError("Output must be a boolean or an integer")

if ("Hello" in HeliconeEvaluator.response()["choices"][0]["message"]["content"]):
    HeliconeEvaluator.output(1)
else:
    HeliconeEvaluator.output(0)
`,
      description: "Check if the response contains the input",
      testInput: exTestInput,
    },
  },
  {
    name: "Valid JSON",
    _type: "composite",
    preset: {
      code: "return response.includes(input)",
      description: "Check if the response contains the input",
      testInput: exTestInput,
    },
  },
];

export type EvaluatorType =
  | (typeof LLM_AS_A_JUDGE_OPTIONS)[number]
  | (typeof COMPOSITE_OPTIONS)[number];

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
        {/* <TabsTrigger value="typescript">LastMile.Dev </TabsTrigger> */}
        <TabsTrigger value="typescript" disabled>
          Typescript <span className="text-xs text-gray-500 px-3">(soon)</span>
        </TabsTrigger>
      </TabsList>
    </>
  );
};
