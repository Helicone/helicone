import { Small } from "@/components/ui/typography";

import FoldedHeader from "@/components/shared/FoldedHeader";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  useGetPromptsWithVersions,
  useGetPromptVersions,
  useSetProductionVersion,
  useGetPromptTags,
  useDeletePrompt,
  useDeletePromptVersion,
} from "@/services/hooks/prompts";
import { useState, useEffect, useRef } from "react";
import PromptDetails from "./PromptDetails";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { PromptWithVersions } from "@/services/hooks/prompts";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import TableFooter from "../requests/tableFooter";
import { useOrg } from "@/components/layout/org/organizationContext";
import router from "next/router";
import useNotification from "@/components/shared/notification/useNotification";
import { SimpleTable } from "@/components/shared/table/simpleTable";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { getInitialColumns } from "./initialColumns";
import TagsFilter from "./TagsFilter";
import { Button } from "@/components/ui/button";

interface PromptsPageProps {
  defaultIndex: number;
  showLegacyBanner?: boolean;
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

  const { data: tags = [], isLoading: isLoadingTags } = useGetPromptTags(); 
  const { data, isLoading } = useGetPromptsWithVersions(
    search,
    selectedTags,
    currentPage - 1,
    pageSize
  );
  const prompts = data?.prompts || [];
  const totalCount = data?.totalCount || 0;

  useEffect(() => {
    if (selectedPrompt && prompts.length > 0) {
      const updatedPrompt = prompts.find(p => p.prompt.id === selectedPrompt.prompt.id);
      if (updatedPrompt) {
        setSelectedPrompt(updatedPrompt);
      }
    }
  }, [prompts, selectedPrompt?.prompt.id]);
  
  const { data: filteredVersions, isLoading: isLoadingFilteredVersions } =
    useGetPromptVersions(
      selectedPrompt?.prompt.id || "",
      filteredMajorVersion !== null ? filteredMajorVersion : undefined
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

  const setProductionVersion = useSetProductionVersion();
  const deletePrompt = useDeletePrompt();
  const deletePromptVersion = useDeletePromptVersion();

  const handleSetProductionVersion = async (promptId: string, promptVersionId: string) => {
    const result = await setProductionVersion.mutateAsync({
      body: {
        promptId,
        promptVersionId,
      },
    });

    if (result.error) {
      setNotification("Error setting production version", "error");
      console.error("Error setting production version", result.error);
    } else {
      setNotification("Production version set successfully", "success");
    }
  }

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
        console.error("Error deleting prompt", result.error);
      } else {
        setNotification("Prompt deleted successfully", "success");
        if (selectedPrompt?.prompt.id === promptId) {
          setSelectedPrompt(null);
          drawerRef.current?.collapse();
        }
      }
    } catch (error) {
      setNotification("Error deleting prompt", "error");
      console.error("Error deleting prompt", error);
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
        console.error("Error deleting prompt version", result.error);
      } else {
        setNotification("Prompt version deleted successfully", "success");
      }
    } catch (error) {
      setNotification("Error deleting prompt version", "error");
      console.error("Error deleting prompt version", error);
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
        aValue = parseFloat(`${a.productionVersion.major_version}.${a.productionVersion.minor_version}`);
        bValue = parseFloat(`${b.productionVersion.major_version}.${b.productionVersion.minor_version}`);
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

  const columns = getInitialColumns();

  return (
    <main className="h-screen flex flex-col w-full animate-fade-in">
      <FoldedHeader
        showFold={false}
        leftSection={
          <Small className="font-bold text-gray-500 dark:text-slate-300">
            Prompts
          </Small>
        }
        rightSection={
          <section className="flex flex-row items-center gap-2">
            {/* <Button
              onClick={() => {
                // TODO: Add docs link
              }}
              variant="secondary"
              size="sm"
            >
              <BookOpenIcon className="h-4 w-4" />
            </Button> */}
          </section>
        }
      />
      
      {/* Banner */}
      {props.showLegacyBanner && (
        <section className="w-full p-4">
          <div className="w-full border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 p-4 text-sm rounded-lg text-blue-800 dark:text-blue-200">
            🎉 You are viewing our revamped Prompts experience, offering prompt versioning and composability with the Playground and AI Gateway!{" "}
            <br />
            <span className="font-medium">The legacy prompts will be deprecated on <i>August 20th, 2025</i>.</span>{" "}
            <a 
              href="/prompts?legacy=true" 
              className="font-medium underline hover:no-underline"
            >
              See the old prompts here →
            </a>
          </div>
        </section>
      )}
      <div className="flex flex-col w-full h-full min-h-[80vh] border-t border-border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>
            <div className="w-full h-full flex flex-col">
              <div className="p-3 border-b border-border bg-background">
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
              onSetProductionVersion={handleSetProductionVersion}
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
