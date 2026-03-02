import { useOrg } from "@/components/layout/org/organizationContext";
import { Col } from "@/components/layout/common";
import { FreePlanCard } from "./freeBillingPage";
import { ProPlanCard, LegacyProPlanCard } from "./proBillingPage";
import { MigrateGrowthToPro } from "./MigrateGrowthToPro";
import { UnknownTierCard } from "./UnknownTierCard";
import { EnterprisePlanCard } from "./EnterprisePlanCard";
import { TeamPlanCard, LegacyTeamPlanCard } from "./teamBillingPage";
import { Skeleton } from "@/components/ui/skeleton";

interface OrgPlanPageProps {}

const BillingPlanPage = (props: OrgPlanPageProps) => {
  const org = useOrg();

  const knownTiers = [
    "free",
    "pro",
    "pro-20240913",
    "pro-20250202",
    "pro-20251210",
    "growth",
    "enterprise",
    "team-20250130",
    "team-20251210",
  ];

  // Show loading skeleton while org data is being fetched
  if (!org?.currentOrg) {
    return (
      <Col className="gap-4 p-4">
        <div className="flex max-w-5xl flex-row gap-6 pb-8">
          <div className="w-full space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-[150px] w-[300px]" />
            <Skeleton className="h-[150px] w-[300px]" />
          </div>
        </div>
      </Col>
    );
  }

  const tier = org.currentOrg.tier;

  return (
    <>
      <Col className="gap-4 p-4">
        {tier === "growth" && <MigrateGrowthToPro />}
        {(tier === "free" || !tier) && <FreePlanCard />}
        {/* Legacy Pro tiers (per-seat, per-request billing) */}
        {(tier === "pro" || tier === "pro-20240913" || tier === "pro-20250202") && (
          <LegacyProPlanCard />
        )}
        {/* New Pro tier (flat $79/mo + tiered usage) */}
        {tier === "pro-20251210" && <ProPlanCard />}
        {/* Legacy Team tier ($200/mo) */}
        {tier === "team-20250130" && <LegacyTeamPlanCard />}
        {/* New Team tier ($799/mo + tiered usage) */}
        {tier === "team-20251210" && <TeamPlanCard />}
        {tier && !knownTiers.includes(tier) && (
          <UnknownTierCard tier={tier} />
        )}
        {tier === "enterprise" && <EnterprisePlanCard />}
      </Col>
    </>
  );
};

export default BillingPlanPage;
