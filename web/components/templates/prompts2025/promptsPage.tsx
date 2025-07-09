import { Small } from "@/components/ui/typography";

import FoldedHeader from "@/components/shared/FoldedHeader";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  useGetPromptsWithVersions,
  useGetPromptVersions,
  useSetProductionVersion,
} from "@/services/hooks/prompts";
import { useState, useEffect } from "react";
import PromptCard from "./PromptCard";
import PromptDetails from "./PromptDetails";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { PromptWithVersions } from "@/services/hooks/prompts";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import TableFooter from "../requests/tableFooter";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";
import router from "next/router";
import useNotification from "@/components/shared/notification/useNotification";

interface PromptsPageProps {
  defaultIndex: number;
}

const PromptsPage = (props: PromptsPageProps) => {
  const [search, setSearch] = useState("");
  const [selectedPrompt, setSelectedPrompt] =
    useState<PromptWithVersions | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filteredMajorVersion, setFilteredMajorVersion] = useState<
    number | null
  >(null);
  const organization = useOrg();
  const { data: hasAccessToPrompts } = useFeatureFlag(
    "prompts_2025",
    organization?.currentOrg?.id ?? "",
  );
  const { setNotification } = useNotification();

  const { data, isLoading } = useGetPromptsWithVersions(
    search,
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

  if (!hasAccessToPrompts) {
    return <div>You do not have access to Prompts</div>;
  }

  const setProductionVersion = useSetProductionVersion();

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

  const handleOpenPromptVersion = (promptVersionId: string) => {
    router.push(`/playground?promptVersionId=${promptVersionId}`);
  };

  return (
    <main className="h-screen flex flex-col w-full animate-fade-in">
      <FoldedHeader
        showFold={false}
        leftSection={
          <Small className="font-bold text-gray-500 dark:text-slate-300">
            Prompts
          </Small>
        }
      />
      <div className="flex flex-col w-full h-full min-h-[80vh] border-t border-border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className="flex w-full h-full"
            defaultSize={70}
            minSize={30}
          >
            <div className="w-full h-full flex flex-col">
              <div className="p-4 border-b border-border bg-background">
                <div className="relative">
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
              </div>

              {/* Prompts list */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <LoadingAnimation />
                ) : prompts && prompts.length > 0 ? (
                  prompts.map((promptWithVersions) => {
                    const productionVersion =
                      promptWithVersions.productionVersion;

                    return (
                      <div
                        key={promptWithVersions.prompt.id}
                        onClick={() => {
                          setSelectedPrompt(promptWithVersions);
                          setFilteredMajorVersion(null);
                        }}
                        className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                          selectedPrompt?.prompt.id ===
                          promptWithVersions.prompt.id
                            ? "bg-accent"
                            : ""
                        }`}
                      >
                        <PromptCard
                          name={promptWithVersions.prompt.name}
                          id={promptWithVersions.prompt.id}
                          majorVersion={productionVersion.major_version}
                          minorVersion={productionVersion.minor_version}
                          totalVersions={promptWithVersions.totalVersions}
                          model={productionVersion.model}
                          updatedAt={new Date(productionVersion.created_at)}
                          createdAt={
                            new Date(promptWithVersions.prompt.created_at)
                          }
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-muted-foreground">
                    No prompts found
                  </div>
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
                pageSizeOptions={[10, 25, 50, 100]}
                showCount={true}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={50} maxSize={60}>
            <PromptDetails
              onSetProductionVersion={handleSetProductionVersion}
              onOpenPromptVersion={handleOpenPromptVersion}
              promptWithVersions={displayPrompt}
              onFilterVersion={handleFilterVersion}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
};

export default PromptsPage;
