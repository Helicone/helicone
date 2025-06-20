import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import * as React from "react";

interface StatsCardProps {
  title: string;
  value?: string | React.ReactNode;
  children: React.ReactNode;
  isLoading: boolean;
}

export default function StatsCard({
  title,
  value,
  children,
  isLoading,
}: StatsCardProps) {
  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="border-b border-border p-4">
        <CardDescription>{title}</CardDescription>
        {value && typeof value === "string" ? (
          <CardTitle className="tabular-nums">{value}</CardTitle>
        ) : (
          value
        )}
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-4 pt-4">
        {isLoading ? (
          <div className="h-full w-full bg-slate-200 dark:bg-slate-800 rounded-md pt-4">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <div className="h-full w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
