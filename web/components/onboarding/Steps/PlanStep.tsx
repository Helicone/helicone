import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  PlanType,
  useDraftOnboardingStore,
} from "@/services/hooks/useOrgOnboarding";
import { useOrg } from "@/components/layout/org/organizationContext";

const PLAN_OPTIONS: Record<PlanType, { label: string; hasTrial: boolean }> = {
  free: { label: "Free ($0/mo)", hasTrial: false },
  pro: { label: "Pro ($20/user/mo)", hasTrial: true },
  team: { label: "Team ($200/mo)", hasTrial: true },
};

export const PlanStep = ({
  onPlanChange,
}: {
  onPlanChange: (plan: PlanType) => void;
}) => {
  const orgId = useOrg()?.currentOrg?.id ?? "";
  const { draftPlan, setDraftPlan } = useDraftOnboardingStore(orgId)();

  return (
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
        value={draftPlan}
        onValueChange={(v: PlanType) => {
          setDraftPlan(v);
          onPlanChange(v);
        }}
      >
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-4 text-sm">
              <span>{PLAN_OPTIONS[draftPlan].label}</span>
              {PLAN_OPTIONS[draftPlan].hasTrial && (
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
};
