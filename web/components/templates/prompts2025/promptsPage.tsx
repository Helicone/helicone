import { Small } from "@/components/ui/typography";

import FoldedHeader from "@/components/shared/FoldedHeader";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useGetPromptsWithVersions } from "@/services/hooks/prompts";
import { useState } from "react";
import PromptCard from "./PromptCard";
// import PromptDetails from "./PromptDetails";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PromptsPageProps {
  defaultIndex: number;
}

const PromptsPage = (props: PromptsPageProps) => {
  const [search, setSearch] = useState("");

  const { data: prompts, isLoading } = useGetPromptsWithVersions(search);
  console.log(prompts);

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
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                  <div className="p-4">Loading...</div>
                ) : prompts && prompts.length > 0 ? (
                prompts.map((promptWithVersions) => {
                  const latestVersion = promptWithVersions.versions.reduce((latest, current) => 
                    new Date(current.created_at) > new Date(latest.created_at) ? current : latest
                  );
                  
                  const updatedAt = new Date(Math.max(
                    ...promptWithVersions.versions.map(v => new Date(v.created_at).getTime())
                  ));
                  
                  return (
                    <PromptCard
                      key={promptWithVersions.prompt.id}
                      name={promptWithVersions.prompt.name}
                      id={promptWithVersions.prompt.id}
                      majorVersion={latestVersion.major_version}
                      minorVersion={latestVersion.minor_version}
                      totalVersions={promptWithVersions.totalVersions}
                      model={latestVersion.model}
                      updatedAt={updatedAt}
                      createdAt={new Date(promptWithVersions.prompt.created_at)}
                    />
                  );
                })
                ) : (
                  <div className="p-4 text-muted-foreground">No prompts found</div>
                )}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
            <div>bruh</div>
            {/* <PromptDetails /> */}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
};

export default PromptsPage;
