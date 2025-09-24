import React from "react";
import { Switch } from "@/components/ui/switch";
import { ChevronRight } from "lucide-react";
import { Small, Muted } from "@/components/ui/typography";
import { Integration } from "./types";
import { LOGOS } from "./connectionSVG";

interface IntegrationRowProps {
  integration: Integration;
  onIntegrationClick: (title: string) => void;
  onToggleEnabled?: (title: string, enabled: boolean) => void;
  isLast?: boolean;
}

const IntegrationRow: React.FC<IntegrationRowProps> = ({
  integration,
  onIntegrationClick,
  onToggleEnabled,
  isLast = false,
}) => {
  const Logo = LOGOS[integration.title as keyof typeof LOGOS];

  const getStatusText = () => {
    if (integration.enabled === undefined) return "";
    return integration.enabled ? "Enabled" : "No configuration";
  };

  const handleToggle = (checked: boolean) => {
    if (onToggleEnabled) {
      onToggleEnabled(integration.title, checked);
    }
  };

  return (
    <div
      className={`flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50 ${
        !isLast ? "border-b border-border" : ""
      }`}
      onClick={() => onIntegrationClick(integration.title)}
    >
      <div className="flex items-center gap-3">
        {Logo && (
          <div className="flex h-6 w-6 items-center justify-center">
            <Logo className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col items-start gap-0.5">
          <Small className="font-medium">{integration.title}</Small>
          <Muted className="text-xs">{getStatusText()}</Muted>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {integration.enabled !== undefined && (
          <Switch
            checked={integration.enabled}
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-green-500"
          />
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default IntegrationRow;
