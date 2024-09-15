import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PromptPlayground from "../../id/promptPlayground";

interface AddColumnHeaderProps {
  promptVersionId: string;
  experimentId: string;
  selectedProviderKey: string | null;
}

const AddColumnHeader: React.FC<AddColumnHeaderProps> = ({
  promptVersionId,
  experimentId,
  selectedProviderKey,
}) => {
  const [open, setOpen] = useState(false);
  const jawn = useJawnClient();
  const promptVersion = useQuery({
    queryKey: ["promptVersion", promptVersionId],
    queryFn: async () => {
      return await jawn.GET(`/v1/prompt/version/{promptVersionId}`, {
        params: { path: { promptVersionId } },
      });
    },
  });

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <button
          className="p-1 text-gray-500 hover:text-gray-700"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="large">
          <SheetHeader>
            <SheetTitle>Add New Column</SheetTitle>
            <SheetDescription>
              <PromptPlayground
                defaultEditMode={true}
                prompt={promptVersion.data?.data?.data?.helicone_template ?? ""}
                selectedInput={undefined}
                onSubmit={async (history, model) => {
                  console.log("Submitted history:", history);
                  console.log("Selected model:", model);
                  const promptData = {
                    model: model,
                    messages: history.map((msg) => ({
                      role: msg.role,
                      content: [
                        {
                          text: msg.content,
                          type: "text",
                        },
                      ],
                    })),
                  };

                  const result = await jawn.POST(
                    "/v1/prompt/version/{promptVersionId}/subversion",
                    {
                      params: {
                        path: {
                          promptVersionId: promptVersionId,
                        },
                      },
                      body: {
                        newHeliconeTemplate: JSON.stringify(promptData),
                        isMajorVersion: false,
                      },
                    }
                  );

                  if (result.error || !result.data) {
                    console.error(result);
                    return;
                  }

                  const newHypothesis = await jawn.POST(
                    "/v1/experiment/hypothesis",
                    {
                      body: {
                        experimentId: experimentId,
                        model: model,
                        promptVersion: promptVersionId,
                        providerKeyId: selectedProviderKey ?? "",
                        status: "RUNNING",
                      },
                    }
                  );

                  promptVersion.refetch();
                }}
                submitText="Test"
                initialModel={"gpt-4o"}
              />
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AddColumnHeader;
