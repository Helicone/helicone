import { cn } from "@/lib/utils";

export type RoleType =
  | "user"
  | "assistant"
  | "system"
  | "tool"
  | "function"
  | "reasoning"
  | "developer";

// Color mappings for each role type using Tailwind semantic colors
const ROLE_STYLES: Record<
  RoleType,
  {
    bg: string;
    text: string;
    border: string;
    label: string;
  }
> = {
  user: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    label: "User",
  },
  assistant: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
    label: "Assistant",
  },
  system: {
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-300 dark:border-green-700",
    label: "System",
  },
  tool: {
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-700",
    label: "Tool",
  },
  function: {
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-700",
    label: "Function",
  },
  reasoning: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    label: "Reasoning",
  },
  developer: {
    bg: "bg-slate-100 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    label: "Developer",
  },
};

// Fallback style for unknown roles
const DEFAULT_STYLE = {
  bg: "bg-gray-100 dark:bg-gray-900/40",
  text: "text-gray-700 dark:text-gray-300",
  border: "border-gray-300 dark:border-gray-700",
  label: "",
};

interface RoleBadgeProps {
  role: string | undefined;
  className?: string;
  size?: "sm" | "md";
}

export function RoleBadge({ role, className, size = "sm" }: RoleBadgeProps) {
  const normalizedRole = (role?.toLowerCase() || "user") as RoleType;
  const styles = ROLE_STYLES[normalizedRole] || DEFAULT_STYLE;

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        sizeClasses,
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {styles.label || role || "User"}
    </span>
  );
}

export function getRoleLabel(role: string | undefined): string {
  const normalizedRole = (role?.toLowerCase() || "user") as RoleType;
  const styles = ROLE_STYLES[normalizedRole];
  return styles?.label || role || "User";
}
