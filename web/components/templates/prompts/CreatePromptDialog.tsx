import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { DiffHighlight } from "../welcome/diffHighlight";
import { Button } from "@/components/ui/button";

interface CreatePromptDialogProps {
  hasAccess: boolean;
  onCreatePrompt: (name: string, model: string, content: string) => void;
}

const CreatePromptDialog: React.FC<CreatePromptDialogProps> = ({
  hasAccess,
  onCreatePrompt: _onCreatePrompt,
}) => {
  const [imNotTechnical, setImNotTechnical] = useState<boolean>(false);

  return (
    <Dialog>
      <DialogTrigger asChild className="w-min">
        <ProFeatureWrapper featureName="Prompts" enabled={hasAccess}>
          <Button variant={"default"} size={"sm"}>
            Create new prompt
          </Button>
        </ProFeatureWrapper>
      </DialogTrigger>
      <DialogContent className="w-[900px]">
        <DialogHeader className="flex flex-row items-center justify-between">
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
        <div className="flex h-[570px] flex-col justify-between space-y-4">
          {imNotTechnical ? (
            <>{/* ... (rest of the non-technical UI) ... */}</>
          ) : (
            <>
              <p className="mb-2 text-gray-500">TS/JS Quick Start</p>
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
