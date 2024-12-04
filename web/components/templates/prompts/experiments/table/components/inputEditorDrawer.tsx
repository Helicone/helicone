"use client";

import React, { useState, useEffect } from "react";
import ThemedDrawer from "@/components/shared/themed/themedDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputEntry } from "./tableElementsRenderer";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { AutosizeTextarea } from "../../../../../ui/autosizeTextArea";

interface InputEditorDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialInputs: InputEntry[];
  onSave: (inputs: InputEntry[]) => void;
}

export default function InputEditorDrawer({
  open,
  setOpen,
  initialInputs,
  onSave,
}: InputEditorDrawerProps) {
  const [inputs, setInputs] = useState<InputEntry[]>(initialInputs);

  useEffect(() => {
    setInputs(initialInputs);
  }, [initialInputs]);

  const handleInputChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updatedInputs = [...inputs];
    updatedInputs[index][field] = value;
    setInputs(updatedInputs);
  };

  const handleAddField = () => {
    setInputs([...inputs, { key: "", value: "" }]);
  };

  const handleRemoveField = (index: number) => {
    const updatedInputs = inputs.filter((_, i) => i !== index);
    setInputs(updatedInputs);
  };

  const handleSave = () => {
    onSave(inputs);
    setOpen(false);
  };

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="h-full flex flex-col justify-between w-full">
        <div className="flex flex-col w-full p-4">
          <h2 className="font-semibold text-xl mb-4">Edit Inputs</h2>
          <div className="space-y-4">
            {inputs.map((input, index) => (
              <div key={index}>
                <div className="flex flex-row items-start space-x-2 px-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveField(index)}
                  >
                    <MinusCircleIcon className="h-5 w-5 text-red-500" />
                    <span className="sr-only">Remove</span>
                  </Button>
                  <div className="flex flex-col w-1/2">
                    <Input
                      id={`key-${index}`}
                      placeholder="Key"
                      value={input.key}
                      onChange={(e) =>
                        handleInputChange(index, "key", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col w-1/2">
                    <AutosizeTextarea
                      id={`value-${index}`}
                      placeholder="Value"
                      value={input.value}
                      className="border border-slate-200"
                      onChange={(e) =>
                        handleInputChange(index, "value", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="px-1.5" onClick={handleAddField}>
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Input
            </Button>
          </div>
        </div>
        <div className="flex justify-end space-x-4 p-4 bg-white">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </ThemedDrawer>
  );
}
