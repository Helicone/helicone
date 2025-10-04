import { ExternalLinkIcon } from "lucide-react";
import { Message } from "@helicone-package/llm-mapper/types";

interface CitationAnnotationsProps {
  annotations: NonNullable<Message["annotations"]>;
}

export default function CitationAnnotations({
  annotations,
}: CitationAnnotationsProps) {
  if (!annotations || annotations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
      <div className="text-xs font-medium text-muted-foreground">
        Sources:
      </div>
      {annotations.map((annotation, index) => (
        <a
          key={index}
          href={annotation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:bg-muted"
        >
          <div className="flex-shrink-0 pt-0.5">
            <ExternalLinkIcon
              size={14}
              className="text-muted-foreground group-hover:text-foreground"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="text-sm font-medium text-foreground group-hover:underline">
              {annotation.title}
            </div>
            {annotation.content && (
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {annotation.content}
              </div>
            )}
            <div className="truncate text-xs text-muted-foreground">
              {annotation.url}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
