import ModelPill from "@/components/templates/requests/modelPill";
import { formatTime } from "./timeUtils";
import { Clock, GitBranch } from "lucide-react";

interface PromptCardProps {
  name: string;
  id: string;
  tags: string[];
  majorVersion: number;
  minorVersion: number;
  totalVersions: number;
  model: string;
  updatedAt: Date;
  createdAt: Date;
}

const PromptCard = ({
  name,
  tags,
  majorVersion,
  minorVersion,
  totalVersions,
  model,
  createdAt,
}: PromptCardProps) => {
  const versionDisplay =
    minorVersion === 0
      ? `v${majorVersion}`
      : `v${majorVersion}.${minorVersion}`;

  const displayName = name.length > 60 ? name.substring(0, 57) + "..." : name;

  return (
    <div className="relative w-full cursor-pointer border-b border-border bg-background transition-colors hover:bg-muted/50">
      <div className="absolute right-4 top-2">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
          {versionDisplay}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3 pr-20">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
        </div>

        <div className="flex min-h-1 flex-wrap gap-1">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <GitBranch size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {totalVersions}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatTime(createdAt, "")}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 right-4">
        <ModelPill model={model} />
      </div>
    </div>
  );
};

export default PromptCard;
