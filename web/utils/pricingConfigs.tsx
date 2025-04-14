import { Package, FlaskConical, ClipboardCheck } from "lucide-react";

export const ADDONS = [
  {
    id: "prompts",
    name: "Prompts",
    description: "Track, version and iterate.",
    price: 50,
    icon: <Package className="w-6 h-6 text-sky-500" />,
  },
  {
    id: "experiments",
    name: "Experiments",
    description: "Test prompts at scale.",
    price: 50,
    icon: <FlaskConical className="w-6 h-6 text-sky-500" />,
  },
  {
    id: "evals",
    name: "Evals",
    description: "Quantify LLM outputs.",
    price: 100,
    icon: <ClipboardCheck className="w-6 h-6 text-sky-500" />,
  },
] as const;

export const Tiers = [
  {
    id: "free",
    name: "Free",
  },
  {
    id: "pro",
    name: "Pro",
  },
  {
    id: "team",
    name: "Team",
  },
  {
    id: "enterprise",
    name: "Enterprise",
  },
  {
    id: "growth",
    name: "Growth",
  },
] as const;

// Tier display information for UI components
export const TIER_DISPLAY_INFO: Record<
  string,
  {
    text: string;
    className: string;
    variants?: string[]; // Additional tier variants that should use this display info
  }
> = {
  free: {
    text: "Upgrade",
    className:
      "text-xs text-sky-500 bg-sky-50 px-2 py-[2px] rounded-md font-semibold",
  },
  pro: {
    text: "Pro",
    className:
      "text-xs text-purple-500 bg-purple-50 px-2 py-[2px] rounded-md font-semibold",
    variants: ["pro-20240913", "pro-20250202"],
  },
  team: {
    text: "Team",
    className:
      "text-xs text-indigo-500 bg-indigo-50 px-2 py-[2px] rounded-md font-semibold",
    variants: ["team-20250130"],
  },
  growth: {
    text: "Growth",
    className:
      "text-xs text-emerald-500 bg-emerald-50 px-2 py-[2px] rounded-md font-semibold",
  },
  enterprise: {
    text: "Enterprise",
    className:
      "text-xs text-slate-500 bg-slate-100 px-2 py-[2px] rounded-md font-semibold",
  },
};

// Helper function to get tier display info based on tier ID
export function getTierDisplayInfo(tierId: string | undefined | null) {
  if (!tierId) {
    return TIER_DISPLAY_INFO["free"];
  }

  // Check for direct match
  if (TIER_DISPLAY_INFO[tierId]) {
    return TIER_DISPLAY_INFO[tierId];
  }

  // Check for variant matches
  for (const [baseId, info] of Object.entries(TIER_DISPLAY_INFO)) {
    if (info.variants?.includes(tierId)) {
      return info;
    }
  }

  // Default to enterprise if no match found
  return TIER_DISPLAY_INFO["enterprise"];
}
