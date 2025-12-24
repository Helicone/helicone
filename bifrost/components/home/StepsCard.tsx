import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepsCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export default function StepsCard({
  stepNumber,
  title,
  description,
  icon,
  content,
  className
}: StepsCardProps) {
  return (
    <Card className={cn("flex flex-col gap-6 p-6 h-full", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xl shrink-0">
            {stepNumber}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <h3 className="text-xl font-semibold text-foreground text-left">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed text-left">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground ml-16">
          {icon}
        </div>
      </div>

      <CardContent className="p-0 ml-16">
        {content}
      </CardContent>
    </Card>
  );
}

