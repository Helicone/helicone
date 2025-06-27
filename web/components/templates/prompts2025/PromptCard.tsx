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
  id,
  tags,
  majorVersion,
  minorVersion,
  totalVersions,
  model,
  updatedAt,
  createdAt,
}: PromptCardProps) => {
  const versionDisplay =
    minorVersion === 0
      ? `v${majorVersion}`
      : `v${majorVersion}.${minorVersion}`;

  const displayName = name.length > 60 ? name.substring(0, 57) + "..." : name;

  return (
    <div className="w-full border-b border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer relative">
      <div className="absolute top-2 right-4">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
          {versionDisplay}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3 pr-20">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm text-foreground">
            {displayName}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 min-h-1">
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
