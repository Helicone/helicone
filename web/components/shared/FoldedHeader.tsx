import { Eye, EyeOff } from "lucide-react";
import { ReactNode, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

interface FoldedHeaderProps {
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  foldContent?: ReactNode;
}
export default function FoldedHeader({
  leftSection,
  rightSection,
  foldContent,
}: FoldedHeaderProps) {
  const [isFolded, setIsFolded] = useState(false);

  return (
    <header className="w-full flex flex-col bg-background border-b border-border">
      {/* Header */}
      <div className="h-10 px-4 w-full flex flex-row items-center justify-between">
        {/* Left Section */}
        {leftSection}

        {/* Right Side */}
        <section className="h-full flex flex-row items-center gap-2">
          <button
            className={`flex items-start border-border p-2 ${
              isFolded
                ? "h-8 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg border"
                : "h-10 bg-muted rounded-t-lg border-t border-x -mb-2"
            }`}
            onClick={() => setIsFolded(!isFolded)}
          >
            {/* Fold Button */}
            {isFolded ? (
              <div className="flex flex-row items-center gap-1">
                <EyeOff className="w-4 h-4" />
                <LuChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-row items-center gap-1">
                <Eye className="w-4 h-4" />
                <LuChevronUp className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </button>

          {/* Right Section */}
          {rightSection}
        </section>
      </div>

      {/* Fold */}
      <div className={`w-full bg-muted ${isFolded ? "h-0" : "h-full"}`}>
        {foldContent}
      </div>
    </header>
  );
}
