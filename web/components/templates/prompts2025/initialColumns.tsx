import { GitBranch, Clock } from "lucide-react";
import { formatTime } from "./timeUtils";
import ModelPill from "@/components/templates/requests/modelPill";
import { ColumnConfig } from "@/components/shared/table/simpleTable";
import { PromptWithVersions } from "@/services/hooks/prompts";
import TagsSummary from "./TagsSummary";

export const getInitialColumns = (): ColumnConfig<PromptWithVersions>[] => [
  {
    key: "name" as keyof PromptWithVersions,
    header: "Name",
    sortable: true,
    minSize: 250,
    render: (item) => {
      const displayName = item.prompt.name.length > 40 
        ? item.prompt.name.substring(0, 37) + "..." 
        : item.prompt.name;
      
      return (
        <span className="font-medium text-sm text-foreground">
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
        <span className="text-sm text-foreground">
          {item.totalVersions}
        </span>
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
    key: "created" as keyof PromptWithVersions,
    header: "Created",
    sortable: true,
    minSize: 350,
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