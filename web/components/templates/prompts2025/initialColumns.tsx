import { GitBranch, Clock, TestTube2 } from "lucide-react";
import { formatTime } from "./timeUtils";
import ModelPill from "@/components/templates/requests/modelPill";
import { ColumnConfig } from "@/components/shared/table/simpleTable";
import { PromptWithVersions } from "@/services/hooks/prompts";
import TagsSummary from "./TagsSummary";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const getInitialColumns = (): ColumnConfig<PromptWithVersions>[] => {
  const router = useRouter();

  return [
  {
    key: "prompt_id" as keyof PromptWithVersions,
    header: "Prompt ID",
    sortable: false,
    minSize: 150,
    render: (item) => {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-black ring-1 ring-inset ring-gray-200">
          {item.prompt.id}
        </span>
      );
    },
  },
  {
    key: "name" as keyof PromptWithVersions,
    header: "Name",
    sortable: true,
    minSize: 250,
    render: (item) => {
      const displayName =
        item.prompt.name.length > 40
          ? item.prompt.name.substring(0, 37) + "..."
          : item.prompt.name;

      return (
        <span className="text-sm font-medium text-foreground">
          {displayName}
        </span>
      );
    },
  },
  {
    key: "version" as keyof PromptWithVersions,
    header: "Version",
    sortable: true,
    minSize: 100,
    render: (item) => {
      const versionDisplay =
        item.productionVersion.minor_version === 0
          ? `v${item.productionVersion.major_version}`
          : `v${item.productionVersion.major_version}.${item.productionVersion.minor_version}`;

      return (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
          {versionDisplay}
        </span>
      );
    },
  },
  {
    key: "totalVersions" as keyof PromptWithVersions,
    header: "Total Versions",
    sortable: true,
    minSize: 120,
    render: (item) => (
      <div className="flex items-center gap-1">
        <GitBranch size={14} className="text-muted-foreground" />
        <span className="text-sm text-foreground">{item.totalVersions}</span>
      </div>
    ),
  },
  {
    key: undefined,
    header: "Model",
    sortable: false,
    minSize: 250,
    render: (item) => <ModelPill model={item.productionVersion.model} />,
  },
  {
    key: undefined,
    header: "Tags",
    sortable: false,
    minSize: 200,
    render: (item) => (
      <TagsSummary tags={item.prompt.tags} maxCharacters={20} />
    ),
  },
  // TODO: ADD USAGE GRAPH
  // {
  //   key: undefined,
  //   header: "Usage",
  //   sortable: false,
  //   minSize: 200,
  //   render: (item) => {
  //     return (
  //       <div>
  //         <span></span>
  //       </div>
  //     )
  //   }
  // },
  {
    key: "playground" as keyof PromptWithVersions,
    header: "Playground",
    sortable: true,
    minSize: 100,
    render: (item) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/playground?promptVersionId=${item.productionVersion.id}`);
          }}
          className="flex items-center gap-1 rounded-lg"
        >
          <TestTube2 size={14} className="text-muted-foreground" />
          <span className="ml-1">Edit</span>
        </Button>
      );
    },
  },
  {
    key: "created" as keyof PromptWithVersions,
    header: "Created",
    sortable: true,
    minSize: 300,
    render: (item) => (
      <div className="flex items-center gap-1">
        <Clock size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {formatTime(new Date(item.prompt.created_at), "")}
        </span>
      </div>
    ),
  },
];
