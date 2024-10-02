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
import { Wand2Icon, XIcon } from "lucide-react";
import { Card } from "@/components/layout/common";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AddColumnHeaderProps {
  promptVersionId: string;
  experimentId: string;
  selectedProviderKey: string | null;
  refetchData: () => void; // Add this line
}

const SCORES = [
  "Sentiment",
  "Accuracy",
  "Contain words",
  "Shorter than 50 characters",
  "Is English",
];

const AddColumnHeader: React.FC<AddColumnHeaderProps> = ({
  promptVersionId,
  experimentId,
  selectedProviderKey,
  refetchData, // Add this line
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

  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [scoreCriterias, setScoreCriterias] = useState<
    {
      scoreType?: (typeof SCORES)[number];
      criteria?: string;
    }[]
  >([]);

  console.log(
    "promptVersion",
    promptVersion.data?.data?.data?.helicone_template
  );

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <button
          className="p-1 text-gray-500 hover:text-gray-700 flex flex-row items-center space-x-2"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="w-5 h-5 text-slate-700" />
          <span className="text-sm font-medium text-slate-700">
            Add Experiment
          </span>
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="large">
          <SheetHeader>
            <SheetTitle>Add New Experiment</SheetTitle>
            <SheetDescription>
              {showSuggestionPanel && (
                <Card className="bg-gray-50 border border-slate-200 py-2 px-4 rounded-md text-slate-900 mb-2">
                  <CardHeader className="flex flex-row items-center justify-between p-0">
                    <div className="flex gap-2 items-center text-slate-900 font-medium">
                      <Wand2Icon className="w-4 h-4" />
                      Give me a suggestion
                    </div>
                    <Button variant="ghost" size="icon">
                      <XIcon
                        className="w-4 h-4"
                        onClick={() => setShowSuggestionPanel(false)}
                      />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {scoreCriterias.map((criteria, index) => (
                      <div className="flex gap-2 items-center" key={index}>
                        <Select
                          value={criteria.scoreType}
                          onValueChange={(value) => {
                            setScoreCriterias(
                              scoreCriterias.map((c) =>
                                c.scoreType === criteria.scoreType
                                  ? { ...c, scoreType: value }
                                  : c
                              )
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCORES.filter(
                              (score) =>
                                !scoreCriterias.some(
                                  (c) => c.scoreType === score
                                ) || criteria.scoreType === score
                            ).map((score) => (
                              <SelectItem value={score}>{score}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs font-semibold text-gray-400">
                          IS
                        </p>
                        <Input
                          placeholder="Type"
                          className="w-24"
                          value={criteria.criteria}
                          onChange={(e) => {
                            setScoreCriterias(
                              scoreCriterias.map((c) =>
                                c.scoreType === criteria.scoreType
                                  ? { ...c, criteria: e.target.value }
                                  : c
                              )
                            );
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="border border-slate-200 aspect-square"
                        >
                          <XIcon
                            className="w-4 h-4"
                            onClick={() => {
                              setScoreCriterias(
                                scoreCriterias.filter(
                                  (c) => c.scoreType !== criteria.scoreType
                                )
                              );
                            }}
                          />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      className="mt-2 border border-slate-200 self-start"
                      onClick={() => {
                        setScoreCriterias([
                          ...scoreCriterias,
                          { scoreType: undefined, criteria: "" },
                        ]);
                      }}
                    >
                      <PlusIcon className="w-4 h-4" /> Add criteria
                    </Button>
                  </CardContent>
                  {scoreCriterias.length > 0 &&
                    scoreCriterias.every((c) => c.scoreType && c.criteria) && (
                      <CardFooter>
                        <Button className="flex items-center gap-2 w-full">
                          <Wand2Icon className="w-4 h-4" />
                          Suggest a prompt
                        </Button>
                      </CardFooter>
                    )}
                </Card>
                // <div className="bg-gray-50 border border-slate-200 py-2 px-4 rounded-md">

                //   {/* {scoreCriterias.map((criteria) => (
                //     <div key={criteria}>{criteria}</div>
                //   ))} */}
                // </div>
              )}
              {!showSuggestionPanel && (
                <Button
                  variant="ghost"
                  onClick={() => setShowSuggestionPanel(true)}
                  className="flex items-center gap-2 bg-gray-50 text-slate-900 mb-4"
                >
                  <Wand2Icon className="w-4 h-4" />
                  Give me a suggestion
                </Button>
              )}
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
                        promptVersion: result.data.data?.id ?? "",
                        providerKeyId: selectedProviderKey ?? "NOKEY",
                        status: "RUNNING",
                      },
                    }
                  );

                  console.log("New hypothesis:", newHypothesis.data);

                  promptVersion.refetch(); // Optional: Refetch prompt versions

                  setOpen(false); // Close the drawer after adding the column

                  refetchData(); // Refetch the table data
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
