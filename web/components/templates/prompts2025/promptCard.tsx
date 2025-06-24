import { Small } from "@/components/ui/typography";
import ModelPill from "@/components/templates/requests/modelPill";

interface PromptCardProps {
  name: string;
  id: string;
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
  majorVersion,
  minorVersion,
  totalVersions,
  model,
  updatedAt,
  createdAt,
}: PromptCardProps) => {
  const versionDisplay = minorVersion === 0 ? `v${majorVersion}` : `v${majorVersion}.${minorVersion}`;
  
  const displayName = name.length > 60 ? name.substring(0, 57) + "..." : name;
  
  const formatTime = (date: Date, prefix: string) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 60) {
      return `${prefix} ${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${prefix} ${diffInHours}h ago`;
    } else {
      return `${prefix} ${diffInDays}d ago`;
    }
  };

  return (
    <div className="w-full border-b border-border bg-background hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm text-foreground">{displayName}</span>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            {versionDisplay}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 pb-3">
        <ModelPill model={model} />
        <span className="text-xs text-muted-foreground">
          Versions: {totalVersions}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(createdAt, "Created")}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTime(updatedAt, "Updated")}
        </span>
      </div>
    </div>
  );
};

export default PromptCard;
