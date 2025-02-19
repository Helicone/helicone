import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PlanType } from "@/store/onboardingStore";

const PLAN_OPTIONS: Record<PlanType, { label: string; hasTrial: boolean }> = {
  free: { label: "Free ($0/mo)", hasTrial: false },
  pro: { label: "Pro ($20/mo/user)", hasTrial: true },
  team: { label: "Team ($200/mo)", hasTrial: true },
};

export const PlanStep = ({
  plan,
  onPlanChange,
  onComplete,
}: {
  plan: PlanType;
  onPlanChange: (plan: PlanType) => void;
  onComplete: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-slate-800">Plan</h2>
      <Link
        href="https://helicone.ai/pricing"
        className="text-sm font-light text-slate-500 underline hover:text-slate-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        See pricing
      </Link>
    </div>
    <Select
      value={plan}
      onValueChange={(v: PlanType) => {
        onPlanChange(v);
        onComplete();
      }}
    >
      <SelectTrigger>
        <SelectValue>
          <div className="flex items-center gap-4">
            <span>{PLAN_OPTIONS[plan].label}</span>
            {PLAN_OPTIONS[plan].hasTrial && (
              <Badge variant="helicone-sky">7-day trial</Badge>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PLAN_OPTIONS).map(([value, { label, hasTrial }]) => (
          <SelectItem key={value} value={value}>
            <div className="flex items-center gap-4 text-xs">
              <span>{label}</span>
              {hasTrial && <Badge variant="helicone-sky">7-day trial</Badge>}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
