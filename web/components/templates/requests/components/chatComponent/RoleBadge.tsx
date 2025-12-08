import { cn } from "@/lib/utils";
import {
  User,
  Bot,
  Settings,
  Wrench,
  Code,
  Brain,
  Terminal,
  HelpCircle,
  Boxes,
  type LucideIcon,
} from "lucide-react";

export type RoleType =
  | "user"
  | "assistant"
  | "system"
  | "tool"
  | "tools"
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
    icon: LucideIcon;
  }
> = {
  user: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    label: "User",
    icon: User,
  },
  assistant: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
    label: "Assistant",
    icon: Bot,
  },
  system: {
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-300 dark:border-green-700",
    label: "System",
    icon: Settings,
  },
  tool: {
    bg: "bg-slate-200 dark:bg-slate-700/50",
    text: "text-slate-700 dark:text-slate-200",
    border: "border-slate-400 dark:border-slate-500",
    label: "Tool",
    icon: Wrench,
  },
  tools: {
    bg: "bg-slate-200 dark:bg-slate-700/50",
    text: "text-slate-700 dark:text-slate-200",
    border: "border-slate-400 dark:border-slate-500",
    label: "Tools",
    icon: Boxes,
  },
  function: {
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-700",
    label: "Function",
    icon: Code,
  },
  reasoning: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    label: "Reasoning",
    icon: Brain,
  },
  developer: {
    bg: "bg-slate-100 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    label: "Developer",
    icon: Terminal,
  },
};

// Fallback style for unknown roles
const DEFAULT_STYLE = {
  bg: "bg-gray-100 dark:bg-gray-900/40",
  text: "text-gray-700 dark:text-gray-300",
  border: "border-gray-300 dark:border-gray-700",
  label: "",
  icon: HelpCircle,
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

  const iconSize = size === "sm" ? 12 : 14;
  const Icon = styles.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium",
        sizeClasses,
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      <Icon size={iconSize} />
      {styles.label || role || "User"}
    </span>
  );
}

export function getRoleLabel(role: string | undefined): string {
  const normalizedRole = (role?.toLowerCase() || "user") as RoleType;
  const styles = ROLE_STYLES[normalizedRole];
  return styles?.label || role || "User";
}

// Header tint colors - subtle solid backgrounds for header rows
// Dark mode uses custom ultra-dark values (darker than Tailwind's -950)
const HEADER_TINTS: Record<RoleType, string> = {
  user: "bg-blue-100 dark:bg-[#0a0a1a]",
  assistant: "bg-purple-100 dark:bg-[#0f0a1a]",
  system: "bg-green-100 dark:bg-[#0a1a0f]",
  tool: "bg-slate-200 dark:bg-[#12141a]",
  tools: "bg-slate-200 dark:bg-[#12141a]",
  function: "bg-yellow-100 dark:bg-[#1a1a0a]",
  reasoning: "bg-amber-100 dark:bg-[#1a140a]",
  developer: "bg-slate-100 dark:bg-[#0a0a0f]",
};

const DEFAULT_HEADER_TINT = "bg-gray-100 dark:bg-[#0a0a0a]";

export function getHeaderTint(role: string | undefined): string {
  const normalizedRole = (role?.toLowerCase() || "user") as RoleType;
  return HEADER_TINTS[normalizedRole] || DEFAULT_HEADER_TINT;
}
