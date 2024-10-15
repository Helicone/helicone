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

export const EvaluatorConfigForm: React.FC<{
  evaluatorType: string;
  onSubmit: (evaluatorId: string) => void;
}> = ({ evaluatorType, onSubmit }) => {
  const [name, setName] = useState<string>("Humorous");
  const [description, setDescription] = useState<string>("");
  const [expectedValueType, setExpectedValueType] = useState<
    "boolean" | "choice" | "range"
  >("boolean");

  const [choiceScores, setChoiceScores] = useState<
    Array<{ score: number; description: string }>
  >([
    { score: 1, description: "Not funny" },
    { score: 2, description: "Slightly funny" },
    { score: 3, description: "Funny" },
    { score: 4, description: "Very funny" },
    { score: 5, description: "Hilarious" },
  ]);
  const [rangeMin, setRangeMin] = useState<number>(0);
  const [rangeMax, setRangeMax] = useState<number>(100);

  const addChoiceScore = () => {
    setChoiceScores([...choiceScores, { score: 0, description: "" }]);
  };

  const removeChoiceScore = (index: number) => {
    setChoiceScores(choiceScores.filter((_, i) => i !== index));
  };

  const updateChoiceScore = (
    index: number,
    field: "score" | "description",
    value: string
  ) => {
    const newScores = [...choiceScores];
    if (field === "score") {
      newScores[index].score = Number(value);
    } else {
      newScores[index].description = value;
    }
    setChoiceScores(newScores);
  };

  const jawn = useJawnClient();

  const openAIFunction = useMemo(() => {
    return generateOpenAITemplate({
      name,
      description,
      expectedValueType,
      choiceScores,
      rangeMin,
      rangeMax,
      model: "gpt-4o",
    });
  }, [name, description, expectedValueType, choiceScores, rangeMin, rangeMax]);

  const notification = useNotification();

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Enter evaluator name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Expected Value Type</Label>
        <RadioGroup
          defaultValue="boolean"
          onValueChange={(value) =>
            setExpectedValueType(value as "boolean" | "choice" | "range")
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="boolean" id="boolean" />
            <Label htmlFor="boolean">Boolean</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="choice" id="choice" />
            <Label htmlFor="choice">Choice Scorer</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="range" id="range" />
            <Label htmlFor="range">Range Scorer</Label>
          </div>
        </RadioGroup>
      </div>

      {expectedValueType === "choice" && (
        <div className="space-y-2">
          <Label>Choice Scores</Label>
          {choiceScores.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="number"
                value={item.score}
                onChange={(e) =>
                  updateChoiceScore(index, "score", e.target.value)
                }
                className="w-24"
              />
              <Input
                type="text"
                value={item.description}
                onChange={(e) =>
                  updateChoiceScore(index, "description", e.target.value)
                }
                placeholder="Short description"
                className="flex-grow"
              />
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeChoiceScore(index)}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
              )}
              {index === choiceScores.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addChoiceScore}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {expectedValueType === "range" && (
        <div className="space-y-2">
          <Label>Range Scorer</Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="range-min">Min</Label>
            <Input
              id="range-min"
              type="number"
              value={rangeMin}
              onChange={(e) => setRangeMin(Number(e.target.value))}
              className="w-24"
            />
            <Label htmlFor="range-max">Max</Label>
            <Input
              id="range-max"
              type="number"
              value={rangeMax}
              onChange={(e) => setRangeMax(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter evaluator description"
          className="min-h-[100px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button
        onClick={() => {
          jawn
            .POST("/v1/evaluator", {
              body: {
                llm_template: openAIFunction,
                scoring_type: `LLM-${expectedValueType.toUpperCase()}`,
                name,
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
      <pre className="text-[8px] whitespace-pre-wrap bg-gray-100 p-4 rounded-md overflow-x-auto">
        {openAIFunction}
      </pre>
    </>
  );
};
