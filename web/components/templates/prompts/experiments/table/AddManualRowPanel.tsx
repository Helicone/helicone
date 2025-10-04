import MarkdownEditor from "@/components/shared/markdownEditor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextCursorInputIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useExperimentTable } from "./hooks/useExperimentTable";
import {
  AlertDialog,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface AddManualRowPanelProps {
  experimentId: string;
  inputKeys: string[];
  onClose: () => void;
}

const AddManualRowPanel = ({
  experimentId,
  inputKeys,
  onClose,
}: AddManualRowPanelProps) => {
  const { addManualRow } = useExperimentTable(experimentId);
  const [inputKV, setInputKV] = useState<Record<string, string>>(
    Object.fromEntries(inputKeys.map((key) => [key, ""])),
  );
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const accordionRef = useRef(null);

  const hasUnsavedChanges = Object.entries(inputKV).some(
    ([_key, value]) => value !== "",
  );

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (hasUnsavedChanges) {
          setShowAlertDialog(true);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", keydownHandler);
    return () => document.removeEventListener("keydown", keydownHandler);
  }, [onClose, hasUnsavedChanges]);

  const handleSaveChanges = () => {
    addManualRow.mutate({
      inputs: inputKV,
    });
    onClose();
  };

  const handleAccordionToggle = () => {
    if (accordionRef.current) {
      (accordionRef.current as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-white dark:bg-neutral-950">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <TextCursorInputIcon className="text-slate-500" />
          <h3 className="font-medium text-slate-900 dark:text-slate-100">
            Add inputs
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="helicone" className="gap-2 text-slate-500">
              <TriangleAlertIcon className="h-3 w-3" />
              <span>Unsaved changes</span>
            </Badge>
          )}
          <XIcon
            className="cursor-pointer text-slate-500 hover:text-slate-700"
            onClick={onClose}
          />
        </div>
      </div>
      <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-4">
        <Accordion type="multiple" className="w-full" defaultValue={inputKeys}>
          {inputKeys.map((inputKey) => (
            <AccordionItem
              key={inputKey}
              value={inputKey}
              ref={accordionRef}
              onToggle={handleAccordionToggle}
              className="border-b border-slate-200 dark:border-slate-800"
            >
              <AccordionTrigger
                iconPosition="start"
                iconClassName="text-slate-500"
                className="text-[13px] font-medium text-slate-700 dark:text-slate-300"
              >
                {inputKey}:
              </AccordionTrigger>
              <AccordionContent>
                <MarkdownEditor
                  className="rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  text={inputKV[inputKey] ?? ""}
                  setText={(text) => {
                    setInputKV({
                      ...inputKV,
                      [inputKey]: text,
                    });
                  }}
                  language="json"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      {hasUnsavedChanges && (
        <div className="absolute bottom-0 left-0 right-0 flex w-full items-center justify-end gap-3 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-neutral-950">
          <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setShowAlertDialog(true)}
              >
                Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard changes</AlertDialogTitle>
                <AlertDialogDescription>
                  You made changes to your inputs. Do you want to discard them?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="w-full items-stretch gap-2">
                <AlertDialogCancel>Go back</AlertDialogCancel>
                <AlertDialogAction onClick={onClose}>
                  Yes, discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSaveChanges} className="cursor-pointer">
            Save New Row
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddManualRowPanel;
