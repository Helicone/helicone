import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { generateOpenAITemplate } from "@/components/shared/CreateNewEvaluator/evaluatorHelpers";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { useMemo, useState } from "react";
import useNotification from "../notification/useNotification";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Col, Row } from "@/components/layout/common";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

export type EvaluatorConfigFormPreset = {
  name: string;
  description: string;
  expectedValueType: "boolean" | "choice" | "range";
  choiceScores?: Array<{ score: number; description: string }>;
  rangeMin?: number;
  rangeMax?: number;
};

export const EvaluatorConfigForm: React.FC<{
  evaluatorType: string;
  onSubmit: (evaluatorId: string) => void;
  configFormParams: EvaluatorConfigFormPreset;
  setConfigFormParams: (params: EvaluatorConfigFormPreset) => void;
}> = ({ evaluatorType, onSubmit, configFormParams, setConfigFormParams }) => {
  const updateConfigFormParams = (
    updates: Partial<EvaluatorConfigFormPreset>
  ) => {
    setConfigFormParams({ ...configFormParams, ...updates });
  };

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const notification = useNotification();

  const jawn = useJawnClient();

  const openAIFunction = useMemo(() => {
    return generateOpenAITemplate({
      name: configFormParams.name,
      description: configFormParams.description,
      expectedValueType: configFormParams.expectedValueType,
      choiceScores: configFormParams.choiceScores,
      rangeMin: configFormParams.rangeMin,
      rangeMax: configFormParams.rangeMax,
      model: "gpt-4o",
    });
  }, [configFormParams]);

  return (
    <Col className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter evaluator name"
          value={configFormParams.name}
          onChange={(e) => {
            if (!/[^a-zA-Z0-9\s]+/g.test(e.target.value)) {
              updateConfigFormParams({ name: e.target.value });
            } else {
              notification.setNotification(
                "Evaluator name can only contain letters and numbers.",
                "error"
              );
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Expected Value Type</Label>
        <RadioGroup
          defaultValue="boolean"
          value={configFormParams.expectedValueType}
          onValueChange={(value) =>
            updateConfigFormParams({
              expectedValueType: value as "boolean" | "choice" | "range",
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="boolean" id="boolean" />
            <Label htmlFor="boolean">Boolean</Label>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                Boolean scorers allow you to assign a score to a response based
                on whether it is true or false.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="choice" id="choice" />
            <Label htmlFor="choice">Choice Scorer</Label>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                Choice scorers allow you to assign a score to a response based
                on how well it matches a predefined set of choices.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="range" id="range" />
            <Label htmlFor="range">Range Scorer</Label>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                Range scorers allow you to assign a score to a response based on
                how well it matches a predefined range.
              </TooltipContent>
            </Tooltip>
          </div>
        </RadioGroup>
      </div>
      {configFormParams.expectedValueType === "boolean" && (
        <div className="space-y-2">
          <Label>Boolean Scorer</Label>
          <br />
          <span className="text-xs text-gray-500">
            Boolean scorers allow you to assign a score to a response based on
            whether it is true or false.
          </span>
        </div>
      )}

      {configFormParams.expectedValueType === "choice" && (
        <div className="space-y-2">
          <Label>Choice Scores</Label>
          <br />
          <span className="text-xs text-gray-500">
            You can add as many choice scores as you want, and they will be used
            to score the response based on how well it matches a predefined set
            of choices.
          </span>
          {configFormParams.choiceScores?.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="number"
                value={item.score}
                onChange={(e) =>
                  updateConfigFormParams({
                    choiceScores: [
                      ...(configFormParams.choiceScores || []),
                      {
                        score: Number(e.target.value),
                        description: item.description,
                      },
                    ],
                  })
                }
                className="w-24"
              />
              <Input
                type="text"
                value={item.description}
                onChange={(e) =>
                  updateConfigFormParams({
                    choiceScores: configFormParams.choiceScores?.map(
                      (item, index) =>
                        index === index
                          ? { score: item.score, description: e.target.value }
                          : item
                    ),
                  })
                }
                placeholder="Short description"
                className="flex-grow"
              />
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateConfigFormParams({
                      choiceScores: configFormParams.choiceScores?.filter(
                        (_, i) => i !== index
                      ),
                    })
                  }
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
              )}
              {index === (configFormParams.choiceScores?.length || 0) - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateConfigFormParams({
                      choiceScores: [
                        ...(configFormParams.choiceScores || []),
                        { score: 0, description: "" },
                      ],
                    })
                  }
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {configFormParams.expectedValueType === "range" && (
        <div className="space-y-2">
          <Label>Range Scorer</Label>
          <br />
          <span className="text-xs text-gray-500">
            You can set the minimum and maximum values for the range. The LLM
            will return a score between these values based on how well it
            matches the predefined range.
          </span>
          <div className="flex items-center space-x-2">
            <Input
              id="range-min"
              type="number"
              value={configFormParams.rangeMin}
              onChange={(e) =>
                updateConfigFormParams({ rangeMin: Number(e.target.value) })
              }
              className="w-24"
            />
            <Input
              id="range-max"
              type="number"
              value={configFormParams.rangeMax}
              onChange={(e) =>
                updateConfigFormParams({ rangeMax: Number(e.target.value) })
              }
              className="w-24"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <br />
        <span className="text-xs text-gray-500">
          Desciptions are used by the LLM to understand what the evaluator does.
        </span>
        <Textarea
          id="description"
          placeholder={
            configFormParams.expectedValueType === "boolean"
              ? "Return true if the response is funny, false otherwise... (optional)"
              : configFormParams.expectedValueType === "choice"
              ? "Return the score of the response based on how well it matches a predefined set of choices... (optional)"
              : "Return a score between 0 and 100 where 0 is super boring and 100 is hilarious... (optional)"
          }
          className="min-h-[100px]"
          value={configFormParams.description}
          onChange={(e) =>
            updateConfigFormParams({ description: e.target.value })
          }
        />
      </div>
      <Row className="justify-between">
        <Button
          onClick={() => {
            jawn
              .POST("/v1/evaluator", {
                body: {
                  llm_template: openAIFunction,
                  scoring_type: `LLM-${configFormParams.expectedValueType.toUpperCase()}`,
                  name: configFormParams.name,
                },
              })
              .then((res) => {
                if (res.data?.data) {
                  notification.setNotification(
                    "Evaluator created successfully",
                    "success"
                  );
                  onSubmit(res.data.data.id);
                } else {
                  notification.setNotification(
                    "Failed to create evaluator",
                    "error"
                  );
                }
              });
          }}
        >
          Create Evaluator
        </Button>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
              Preview OpenAI Function
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-4 rounded-md overflow-x-auto">
              {openAIFunction}
            </pre>
          </DialogContent>
        </Dialog>
      </Row>
    </Col>
  );
};
