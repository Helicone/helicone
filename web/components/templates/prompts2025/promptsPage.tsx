import { Small } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { logger } from "@/lib/telemetry/logger";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";

import FoldedHeader from "@/components/shared/FoldedHeader";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  useGetPromptsWithVersions,
  useGetPromptVersions,
  useSetPromptVersionEnvironment,
  useGetPromptTags,
  useDeletePrompt,
  useDeletePromptVersion,
  useRenamePrompt,
  useUpdatePromptTags,
} from "@/services/hooks/prompts";
import { useState, useEffect, useRef } from "react";
import PromptDetails from "./PromptDetails";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { PromptWithVersions } from "@/services/hooks/prompts";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import TableFooter from "../requests/tableFooter";
import router from "next/router";
import useNotification from "@/components/shared/notification/useNotification";
import { SimpleTable } from "@/components/shared/table/simpleTable";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { getInitialColumns } from "./initialColumns";
import TagsFilter from "./TagsFilter";
import { useHeliconeAgent } from "@/components/templates/agent/HeliconeAgentContext";

interface PromptsPageProps {
  defaultIndex: number;
}

const PromptsPage = (props: PromptsPageProps) => {
  const [search, setSearch] = useState("");
  const [selectedPrompt, setSelectedPrompt] =
    useState<PromptWithVersions | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [filteredMajorVersion, setFilteredMajorVersion] = useState<
    number | null
  >(null);
  const [sortKey, setSortKey] = useState<string | undefined>("created");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { setNotification } = useNotification();
  const drawerRef = useRef<any>(null);
  const [drawerSize, setDrawerSize] = useLocalStorage("prompt-drawer-size", 40);
  const { setToolHandler } = useHeliconeAgent();

  const { data: tags = [], isLoading: isLoadingTags } = useGetPromptTags();
  const { data, isLoading } = useGetPromptsWithVersions(
    search,
    selectedTags,
    currentPage - 1,
    pageSize,
  );
  const prompts = data?.prompts || [];
  const totalCount = data?.totalCount || 0;

  useEffect(() => {
    if (selectedPrompt && prompts.length > 0) {
      const updatedPrompt = prompts.find(
        (p) => p.prompt.id === selectedPrompt.prompt.id,
      );
      if (updatedPrompt) {
        setSelectedPrompt(updatedPrompt);
      }
    }
  }, [prompts, selectedPrompt?.prompt.id]);

  const { data: filteredVersions, isLoading: isLoadingFilteredVersions } =
    useGetPromptVersions(
      selectedPrompt?.prompt.id || "",
      filteredMajorVersion !== null ? filteredMajorVersion : undefined,
    );

  const displayPrompt =
    selectedPrompt && filteredMajorVersion !== null && filteredVersions
      ? {
          ...selectedPrompt,
          versions: filteredVersions,
        }
      : selectedPrompt;

  const handleFilterVersion = (majorVersion: number | null) => {
    setFilteredMajorVersion(majorVersion);
  };

  const setEnvironment = useSetPromptVersionEnvironment();
  const deletePrompt = useDeletePrompt();
  const deletePromptVersion = useDeletePromptVersion();
  const renamePrompt = useRenamePrompt();
  const updatePromptTags = useUpdatePromptTags();

  const handleRenamePrompt = async (promptId: string, newName: string) => {
    logger.info({ promptId, newName }, "Renaming prompt");
    const result = await renamePrompt.mutateAsync({
      params: {
        path: {
          promptId,
        },
      },
      body: {
        name: newName,
      },
    });

    if (result.error) {
      setNotification("Error renaming prompt", "error");
      logger.error(
        { error: result.error, promptId, newName },
        "Error renaming prompt",
      );
    } else {
      setNotification("Prompt renamed successfully", "success");
    }
  };

  const handleUpdatePromptTags = async (
    promptId: string,
    tags: string[],
  ): Promise<boolean> => {
    logger.info({ promptId, tags }, "Updating prompt tags");
    try {
      const result = await updatePromptTags.mutateAsync({
        params: {
          path: {
            promptId,
          },
        },
        body: {
          tags,
        },
      });

      if (result.error) {
        setNotification("Error updating tags", "error");
        logger.error({ error: result.error, promptId, tags }, "Error updating tags");
        return false;
      }

      const updatedTags = result.data?.data ?? tags;

      if (selectedPrompt?.prompt.id === promptId) {
        setSelectedPrompt((prev) =>
          prev
            ? {
                ...prev,
                prompt: {
                  ...prev.prompt,
                  tags: updatedTags,
                },
              }
            : prev,
        );
      }

      setNotification("Tags updated", "success");
      return true;
    } catch (error) {
      setNotification("Error updating tags", "error");
      logger.error({ error, promptId, tags }, "Error updating tags");
      return false;
    }
  };

  const handleSetPromptVersionEnvironment = async (
    promptId: string,
    promptVersionId: string,
    environment: string,
  ) => {
    const result = await setEnvironment.mutateAsync({
      body: {
        promptId,
        promptVersionId,
        environment,
      },
    });

    if (result.error) {
      setNotification("Error setting environment", "error");
      logger.error(
        { error: result.error, promptId, promptVersionId, environment },
        "Error setting environment",
      );
    } else {
      setNotification("Environment set successfully", "success");
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      const result = await deletePrompt.mutateAsync({
        params: {
          path: {
            promptId,
          },
        },
      });

      if (result.error) {
        setNotification("Error deleting prompt", "error");
        logger.error(
          { error: result.error, promptId },
          "Error deleting prompt",
        );
      } else {
        setNotification("Prompt deleted successfully", "success");
        if (selectedPrompt?.prompt.id === promptId) {
          setSelectedPrompt(null);
          drawerRef.current?.collapse();
        }
      }
    } catch (error) {
      setNotification("Error deleting prompt", "error");
      logger.error({ error, promptId }, "Error deleting prompt");
    }
  };

  const handleDeletePromptVersion = async (promptVersionId: string) => {
    if (!selectedPrompt) return;

    try {
      const result = await deletePromptVersion.mutateAsync({
        params: {
          path: {
            promptId: selectedPrompt.prompt.id,
            versionId: promptVersionId,
          },
        },
      });

      if (result.error) {
        setNotification("Error deleting prompt version", "error");
        logger.error(
          {
            error: result.error,
            promptVersionId,
            promptId: selectedPrompt.prompt.id,
          },
          "Error deleting prompt version",
        );
      } else {
        setNotification("Prompt version deleted successfully", "success");
      }
    } catch (error) {
      setNotification("Error deleting prompt version", "error");
      logger.error(
        { error, promptVersionId, promptId: selectedPrompt?.prompt.id },
        "Error deleting prompt version",
      );
    }
  };

  const handleOpenPromptVersion = (promptVersionId: string) => {
    router.push(`/playground?promptVersionId=${promptVersionId}`);
  };

  const handleRowSelect = (promptWithVersions: PromptWithVersions) => {
    setSelectedPrompt(promptWithVersions);
    setFilteredMajorVersion(null);
    drawerRef.current?.expand();
  };

  const handleSort = (key: string | undefined, direction: "asc" | "desc") => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const sortedPrompts = [...prompts].sort((a, b) => {
    if (!sortKey) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortKey) {
      case "name":
        aValue = a.prompt.name;
        bValue = b.prompt.name;
        break;
      case "version":
        aValue = parseFloat(
          `${a.productionVersion.major_version}.${a.productionVersion.minor_version}`,
        );
        bValue = parseFloat(
          `${b.productionVersion.major_version}.${b.productionVersion.minor_version}`,
        );
        break;
      case "totalVersions":
        aValue = a.totalVersions;
        bValue = b.totalVersions;
        break;
      case "created":
        aValue = new Date(a.prompt.created_at);
        bValue = new Date(b.prompt.created_at);
        break;
      default:
        return 0;
    }

    if (aValue === bValue) return 0;

    const compareResult = aValue < bValue ? -1 : 1;
    return sortDirection === "asc" ? compareResult : -compareResult;
  });

  const handlePlaygroundActionClick = (promptVersionId: string) => {
    router.push(`/playground?promptVersionId=${promptVersionId}`);
  };

  const columns = getInitialColumns(handlePlaygroundActionClick);

  useEffect(() => {
    setToolHandler("prompts-search", async (args: { query: string }) => {
      setSearch(args.query);
      return {
        success: true,
        message: `Successfully searched for prompts: "${args.query}"`,
      };
    });

    setToolHandler("prompts-get", async () => {
      const promptInfo = prompts.map((prompt) => {
        return `Name: ${prompt.prompt.name} (ID: ${prompt.prompt.id})\n}`;
      });
      return {
        success: true,
        message: "PROMPTS: " + JSON.stringify(promptInfo),
      };
    });

    setToolHandler("prompts-select", async (args: { id: string }) => {
      const prompt = prompts.find((p) => p.prompt.id === args.id);
      if (prompt) {
        handleRowSelect(prompt);
        return {
          success: true,
          message: `Successfully selected prompt: ${prompt.prompt.name} (${prompt.prompt.id})`,
        };
      }
      return {
        success: false,
        message: `Prompt does not exist with ID ${args.id}`,
      };
    });

    setToolHandler("prompts-get_versions", async (args: { id: string }) => {
      const prompt = prompts.find((p) => p.prompt.id === args.id);
      if (prompt) {
        const promptVersions = prompt.versions.map((version) => {
          return `
          Version: ${version.major_version}.${version.minor_version} (ID: ${version.id})
          Environment: ${version.environment}
          Commit Message: ${version.commit_message}\n
          `;
        });
        return {
          success: true,
          message: `PROMPT VERSIONS: ${JSON.stringify(promptVersions)}`,
        };
      }
      return {
        success: false,
        message: `Prompt does not exist with ID ${args.id}`,
      };
    });
  }, [prompts]);

  // Check if we should show empty state
  if (!isLoading && !isLoadingTags && prompts.length === 0) {
    return (
      <EmptyStateCard
        feature="prompts"
        onPrimaryClick={() => router.push("/playground?createPrompt=true")}
      />
    );
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <Small className="font-bold text-gray-500 dark:text-slate-300">
            Prompts
          </Small>
        }
        rightSection={
          <section className="flex flex-row items-center gap-2">
            <Button
              onClick={() => {
                window.open(
                  "https://docs.helicone.ai/features/advanced-usage/prompts",
                  "_blank",
                );
              }}
              variant="secondary"
              size="sm"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </section>
        }
      />

      <div className="flex h-full min-h-[80vh] w-full flex-col border-t border-border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>
            <div className="flex h-full w-full flex-col">
              <div className="border-b border-border bg-background p-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search prompts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      router.push("/playground");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="ml-2 text-sm">Create Prompt</span>
                  </Button>
                  <TagsFilter
                    tags={tags}
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {isLoading || isLoadingTags ? (
                  <LoadingAnimation />
                ) : (
                  <SimpleTable
                    data={sortedPrompts}
                    columns={columns}
                    emptyMessage="No prompts yet. Create one in the Playground!"
                    onSelect={handleRowSelect}
                    onSort={handleSort}
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    className="h-full"
                  />
                )}
              </div>

              <TableFooter
                currentPage={currentPage}
                pageSize={pageSize}
                count={totalCount}
                isCountLoading={isLoading}
                onPageChange={(newPage) => setCurrentPage(newPage)}
                onPageSizeChange={(newPageSize) => {
                  setPageSize(newPageSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[25, 50, 100]}
                showCount={false}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel
            ref={drawerRef}
            defaultSize={0}
            minSize={40}
            maxSize={80}
            onResize={(size) => {
              if (size > 0) {
                setDrawerSize(size);
              }
            }}
            onExpand={() => {
              drawerRef.current?.resize(drawerSize);
            }}
            collapsible={true}
          >
            <PromptDetails
              onRenamePrompt={handleRenamePrompt}
              onUpdatePromptTags={handleUpdatePromptTags}
              onSetEnvironment={handleSetPromptVersionEnvironment}
              onOpenPromptVersion={handleOpenPromptVersion}
              onDeletePrompt={handleDeletePrompt}
              onDeletePromptVersion={handleDeletePromptVersion}
              promptWithVersions={displayPrompt}
              onFilterVersion={handleFilterVersion}
              onCollapse={() => drawerRef.current?.collapse()}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
};

export default PromptsPage;
