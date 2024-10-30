import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import React, { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { MODEL_LIST } from "../playground/new/modelList";
import { DiffHighlight } from "../welcome/diffHighlight";
import { Button } from "@/components/ui/button";

interface CreatePromptDialogProps {
  hasAccess: boolean;
  onCreatePrompt: (name: string, model: string, content: string) => void;
}

const CreatePromptDialog: React.FC<CreatePromptDialogProps> = ({
  hasAccess,
  onCreatePrompt,
}) => {
  const [imNotTechnical, setImNotTechnical] = useState<boolean>(false);
  const [newPromptName, setNewPromptName] = useState<string>("");
  const [newPromptModel, setNewPromptModel] = useState(MODEL_LIST[0].value);
  const [newPromptContent, setNewPromptContent] = useState("");
  const [promptVariables, setPromptVariables] = useState<string[]>([]);
  const newPromptInputRef = useRef<HTMLInputElement>(null);

  const extractVariables = useCallback((content: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(regex);
    return matches ? matches.map((match) => match.slice(2, -2).trim()) : [];
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild className="w-min">
        <ProFeatureWrapper featureName="Prompts" enabled={hasAccess}>
          <Button variant={"default"} size={"sm"}>
            Create new prompt
          </Button>
        </ProFeatureWrapper>
      </DialogTrigger>
      <DialogContent className="w-[900px] ">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>Create a new prompt</DialogTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="im-not-technical"
              checked={imNotTechnical}
              onCheckedChange={setImNotTechnical}
            />
            <Label htmlFor="im-not-technical">I&apos;m not technical</Label>
          </div>
        </DialogHeader>
        <div className="flex flex-col space-y-4 h-[570px] justify-between">
          {imNotTechnical ? (
            <>{/* ... (rest of the non-technical UI) ... */}</>
          ) : (
            <>
              <p className="text-gray-500 mb-2">TS/JS Quick Start</p>
              <DiffHighlight
                code={`
// 1. Add this line
import { hprompt } from "@helicone/helicone";

const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        // 2: Add hprompt to any string, and nest any variable in additional brackets \`{}\`
        content: hprompt\`Write a story about \${{ scene }}\`,
      },
    ],
    model: "gpt-3.5-turbo",
  },
  {
    // 3. Add Prompt Id Header
    headers: {
      "Helicone-Prompt-Id": "prompt_story",
    },
  }
);
                `}
                language="typescript"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromptDialog;
