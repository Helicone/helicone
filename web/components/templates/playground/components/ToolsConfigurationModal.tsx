import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConicalIcon, PlusIcon, Trash2, WrenchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tool } from "@helicone-package/llm-mapper/types";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

interface ToolsConfigurationModalProps {
  tools: Tool[];
  onToolsChange: (_tools: Tool[]) => void;
  isScrolled: boolean;
}

export default function ToolsConfigurationModal({
  tools,
  onToolsChange,
  isScrolled,
}: ToolsConfigurationModalProps) {
  const [toolsDialogOpen, setToolsDialogOpen] = useState(false);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(
    tools ? (tools.length > 0 ? 0 : null) : null
  );
  const [currentTools, setCurrentTools] = useState<Tool[]>(tools || []);

  useEffect(() => {
    setSelectedToolIndex(tools ? (tools.length > 0 ? 0 : null) : null);
    setCurrentTools(tools || []);
  }, [tools]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(tools) !== JSON.stringify(currentTools);
  }, [tools, currentTools]);

  const [parametersAsString, setParametersAsString] = useState<string>(
    selectedToolIndex !== null
      ? JSON.stringify(
          currentTools[selectedToolIndex]?.parameters ?? {},
          null,
          2
        )
      : ""
  );
  const [toolAsString, setToolAsString] = useState<string>(
    selectedToolIndex !== null
      ? JSON.stringify(currentTools[selectedToolIndex] ?? {}, null, 2)
      : ""
  );

  useEffect(() => {
    if (selectedToolIndex !== null) {
      setParametersAsString(
        JSON.stringify(
          currentTools[selectedToolIndex]?.parameters ?? {},
          null,
          2
        )
      );
      setToolAsString(
        JSON.stringify(currentTools[selectedToolIndex] ?? {}, null, 2)
      );
    }
  }, [selectedToolIndex, currentTools]);

  const updateToolField = (field: keyof Tool, value: string) => {
    if (selectedToolIndex === null) return;

    const newTools = [...currentTools];
    newTools[selectedToolIndex] = {
      ...newTools[selectedToolIndex],
      [field]: value,
    };
    setCurrentTools(newTools);
  };

  const handleJsonViewChange = (text: string) => {
    setToolAsString(text);
    try {
      const parsedTool = JSON.parse(text);
      if (selectedToolIndex !== null) {
        const newTools = [...currentTools];
        newTools[selectedToolIndex] = parsedTool;
        setCurrentTools(newTools);
      }
    } catch {}
  };

  return (
    <Dialog open={toolsDialogOpen} onOpenChange={setToolsDialogOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "border-none h-9 w-9",
                isScrolled &&
                  "bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900"
              )}
            >
              <WrenchIcon className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Tools Configuration</TooltipContent>
      </Tooltip>
      <DialogContent
        className={clsx(
          "max-w-7xl max-h-[95vh] gap-0 overflow-y-auto items-start flex flex-col",
          currentTools.length !== 0 ? "w-[95vw]" : "w-auto"
        )}
      >
        <div className="flex items center justify-between">
          <div className="flex items-center">
            <FlaskConicalIcon className="w-5 h-5 mr-2.5 text-slate-500" />
            <DialogTitle>
              <h3 className="text-base font-medium text-slate-950 dark:text-white mr-3">
                Tools Configuration
              </h3>
            </DialogTitle>
          </div>
        </div>
        {currentTools.length === 0 ? (
          <div className="flex-1 p-20 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <FlaskConicalIcon className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-500">No tools configured</p>
              <p className="text-xs text-slate-400">
                Add a tool to get started
              </p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                const newTools = [
                  {
                    name: "new_function",
                    description: "",
                    parameters: {},
                  },
                ];
                setCurrentTools(newTools);
                setSelectedToolIndex(0);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Add Tool
            </Button>
          </div>
        ) : (
          <div className="flex h-full gap-4 py-4 w-full">
            {/* Tools List */}
            <div className="w-64 border-r pr-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Tools</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newTools = [
                      ...currentTools,
                      {
                        name: "new_function",
                        description: "",
                        parameters: {},
                      },
                    ];
                    setCurrentTools(newTools);
                    setSelectedToolIndex(newTools.length - 1);
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {currentTools.map((tool, index) => (
                  <ContextMenu key={index}>
                    <ContextMenuTrigger asChild>
                      <Button
                        key={index}
                        variant={
                          selectedToolIndex === index ? "secondary" : "ghost"
                        }
                        className="w-full justify-start"
                        onClick={() => setSelectedToolIndex(index)}
                      >
                        {tool.name || `Tool ${index + 1}`}
                      </Button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onSelect={() => {
                          onToolsChange(
                            currentTools.filter((_, i) => i !== index)
                          );
                          if (selectedToolIndex === index) {
                            setSelectedToolIndex(
                              currentTools.length > 0
                                ? index === 0
                                  ? 1
                                  : index - 1
                                : null
                            );
                          }
                        }}
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedToolIndex !== null &&
                currentTools[selectedToolIndex] && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between ">
                      <Tabs defaultValue="form" className="w-full">
                        <TabsList>
                          <TabsTrigger value="form">Form</TabsTrigger>
                          <TabsTrigger value="json">JSON</TabsTrigger>
                        </TabsList>
                        <TabsContent value="form" className="mt-4">
                          <div className="flex flex-col gap-2">
                            <div className="grid gap-2">
                              <Label
                                className="text-sm justify-start text-slate-500"
                                htmlFor="name"
                              >
                                Name
                              </Label>
                              <Input
                                id="name"
                                value={currentTools[selectedToolIndex].name}
                                onChange={(e) =>
                                  updateToolField("name", e.target.value)
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label
                                className="text-sm justify-start text-slate-500"
                                htmlFor="description"
                              >
                                Description
                              </Label>
                              <Input
                                id="description"
                                value={
                                  currentTools[selectedToolIndex].description
                                }
                                onChange={(e) =>
                                  updateToolField("description", e.target.value)
                                }
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label
                                className="text-sm justify-start text-slate-500"
                                htmlFor="parameters"
                              >
                                Parameters (JSON Schema)
                              </Label>
                              <MarkdownEditor
                                id="parameters"
                                language="json"
                                text={parametersAsString}
                                setText={setParametersAsString}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="json" className="mt-4">
                          <MarkdownEditor
                            id="tool-editor"
                            language="json"
                            text={toolAsString}
                            setText={handleJsonViewChange}
                          />
                        </TabsContent>
                      </Tabs>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          onToolsChange(
                            currentTools.filter(
                              (_, i) => i !== selectedToolIndex
                            )
                          );
                          setSelectedToolIndex((prev) =>
                            currentTools.length > 0
                              ? prev === 0
                                ? 1
                                : prev! - 1
                              : null
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
        {currentTools.length > 0 && (
          <DialogFooter className="flex justify-between w-full">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                try {
                  if (selectedToolIndex !== null) {
                    const updatedTools = [...currentTools];
                    const parsedParameters = JSON.parse(parametersAsString);
                    updatedTools[selectedToolIndex] = {
                      ...updatedTools[selectedToolIndex],
                      parameters: parsedParameters,
                    };
                    onToolsChange(updatedTools);
                  } else {
                    onToolsChange(currentTools);
                  }
                  setToolsDialogOpen(false);
                } catch (error) {
                  console.error("Invalid JSON");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
