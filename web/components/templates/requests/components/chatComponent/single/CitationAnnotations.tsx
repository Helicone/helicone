import { ExternalLinkIcon } from "lucide-react";
import { Message } from "@helicone-package/llm-mapper/types";

interface CitationAnnotationsProps {
  annotations: NonNullable<Message["annotations"]>;
  showAnnotations?: boolean;
}

export default function CitationAnnotations({
  annotations,
  showAnnotations = true,
}: CitationAnnotationsProps) {
  // Hide if no annotations, empty, or explicitly hidden (collapsed message)
  if (!annotations || annotations.length === 0 || !showAnnotations) {
    return null;
  }

  const displayedAnnotations = annotations;

  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-2">
      <div className="text-xs font-medium text-muted-foreground">Sources:</div>
      {displayedAnnotations.map((annotation, index) => (
        <a
          key={index}
          href={annotation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-2 rounded-md border border-border bg-muted/50 p-2 transition-colors hover:bg-muted"
        >
          <div className="flex-shrink-0 pt-0.5">
            <ExternalLinkIcon
              size={12}
              className="text-muted-foreground group-hover:text-foreground"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="text-xs font-medium text-foreground group-hover:underline">
              {annotation.title}
            </div>
            {annotation.content && (
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {annotation.content}
              </div>
            )}
            <div className="truncate text-xs text-muted-foreground opacity-70">
              {annotation.url}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
