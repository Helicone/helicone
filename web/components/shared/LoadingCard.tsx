import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoadingCardProps {
  className?: string;
  title?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  className = "",
  title = "Loading data...",
}) => {
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingCard;
