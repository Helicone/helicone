import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MarkdownEditor from "@/components/shared/markdownEditor";
import clsx from "clsx";
import { useState } from "react";
import useNotification from "@/components/shared/notification/useNotification";

interface ResponseFormatModalProps {
  responseFormat: any;
  onResponseFormatChange: (format: any) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const FORMAT_PLACEHOLDER = `{
  "name": "weather",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City or location name"
      },
      "temperature": {
        "type": "number",
        "description": "Temperature in Celsius"
      },
      "conditions": {
        "type": "string",
        "description": "Weather conditions description"
      }
    },
    "required": ["location", "temperature", "conditions"],
    "additionalProperties": false
  }
}`;

export default function ResponseFormatModal({
  open,
  setOpen,
  responseFormat,
  onResponseFormatChange,
}: ResponseFormatModalProps) {
  const [responseFormatText, setResponseFormatText] = useState(
    JSON.stringify(responseFormat, null, 2)
  );
  const { setNotification } = useNotification();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Response Format
        </Button>
      </DialogTrigger> */}
      <DialogContent
        className={clsx(
          "max-w-7xl max-h-[600px] h-full gap-0 overflow-y-auto items-start flex flex-col"
        )}
      >
        <DialogHeader>
          <DialogTitle>Response Format</DialogTitle>
        </DialogHeader>
        <MarkdownEditor
          placeholder={FORMAT_PLACEHOLDER}
          language="json"
          text={responseFormatText}
          setText={setResponseFormatText}
          className="w-full h-full overflow-y-auto border border-border rounded-md my-4"
          containerClassName="w-full h-full"
        />
        <DialogFooter className="flex justify-between w-full">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => {
              try {
                if (responseFormatText) {
                  const parsed = JSON.parse(responseFormatText || "{}");
                  onResponseFormatChange(parsed);
                } else {
                  onResponseFormatChange(undefined);
                }
                setOpen(false);
              } catch (e) {
                setNotification("Invalid JSON", "error");
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
