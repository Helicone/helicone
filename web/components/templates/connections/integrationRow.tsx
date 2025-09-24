import React from "react";
import { ChevronRight } from "lucide-react";
import { Integration } from "./types";
import { LOGOS } from "./connectionSVG";

interface IntegrationRowProps {
  integration: Integration;
  onIntegrationClick: (title: string) => void;
  onToggleEnabled?: (title: string, enabled: boolean) => void;
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({
  integration,
  onIntegrationClick,
}) => {
  const Logo = LOGOS[integration.title as keyof typeof LOGOS];

  const getStatusText = () => {
    if (!integration.configured) return "No configuration";
    return integration.enabled
      ? "Configuration active"
      : "Configuration - not active";
  };

  const getStatusColor = () => {
    if (!integration.configured) return "text-muted-foreground";
    return integration.enabled
      ? "text-green-600 dark:text-green-400"
      : "text-yellow-600 dark:text-yellow-400";
  };

  return (
    <div className="border-b border-border bg-background transition-colors last:border-b-0">
      <button
        onClick={() => onIntegrationClick(integration.title)}
        className="w-full p-3 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-muted">
              {Logo && <Logo className="h-4 w-4 object-contain" />}
            </div>
            <div className="text-sm font-medium">{integration.title}</div>
            <div className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default IntegrationRow;
