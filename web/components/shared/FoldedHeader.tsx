import { Eye, EyeOff } from "lucide-react";
import { ReactNode, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

interface FoldedHeaderProps {
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  foldContent?: ReactNode;
  showFold?: boolean;
}
export default function FoldedHeader({
  leftSection,
  rightSection,
  foldContent,
  showFold = true,
}: FoldedHeaderProps) {
  const [isFolded, setIsFolded] = useState(false);

  return (
    <section className="flex w-full shrink-0 flex-col border-b bg-background dark:border-border">
      {/* Header */}
      <div className="my-2 flex h-10 w-full flex-row items-center justify-between px-4 dark:border-border">
        {/* Left Section */}
        {leftSection}

        {/* Right Side */}
        <section className="flex h-full flex-row items-center gap-2">
          {showFold && (
            <button
              className={`flex items-start border-border p-2 ${
                isFolded
                  ? "h-8 rounded-lg border bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900"
                  : "h-8 rounded-lg border bg-muted"
              }`}
              onClick={() => setIsFolded(!isFolded)}
            >
              {/* Fold Button */}
              {isFolded ? (
                <div className="flex flex-row items-center gap-1">
                  <EyeOff className="h-4 w-4" />
                  <LuChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-row items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <LuChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </button>
          )}

          {/* Right Section */}
          {rightSection}
        </section>
      </div>

      {/* Fold */}
      {showFold && (
        <section
          className={`overflow-hidden transition-all duration-300 dark:border-border ${
            isFolded ? "h-0" : "h-8 border-t"
          } w-full bg-muted`}
        >
          {foldContent}
        </section>
      )}
    </section>
  );
}
