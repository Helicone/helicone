import React from "react";
import { BarChartIcon } from "lucide-react";

interface NoDataCardProps {
  title?: string;
  description?: string;
  className?: string;
}

const NoDataCard: React.FC<NoDataCardProps> = ({
  title = "No data available",
  description = "There is no data to display for the current selection.",
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <BarChartIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
    </div>
  );
};

export default NoDataCard;
