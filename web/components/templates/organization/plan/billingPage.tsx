import { useOrg } from "@/components/layout/org/organizationContext";
import { Col } from "@/components/layout/common";
import { FreePlanCard } from "./freeBillingPage";
import { ProPlanCard, LegacyProPlanCard } from "./proBillingPage";
import { MigrateGrowthToPro } from "./MigrateGrowthToPro";
import { UnknownTierCard } from "./UnknownTierCard";
import { EnterprisePlanCard } from "./EnterprisePlanCard";
import { TeamPlanCard, LegacyTeamPlanCard } from "./teamBillingPage";

interface OrgPlanPageProps {}

const BillingPlanPage = (props: OrgPlanPageProps) => {
  const org = useOrg();

  const knownTiers = [
    "free",
    "pro-20240913",
    "pro-20250202",
    "pro-20251210",
    "growth",
    "enterprise",
    "team-20250130",
    "team-20251210",
  ];

  return (
    <>
      <Col className="gap-4 p-4">
        {org?.currentOrg?.tier === "growth" && <MigrateGrowthToPro />}
        {org?.currentOrg?.tier === "free" && <FreePlanCard />}
        {/* Legacy Pro tiers (per-seat, per-request billing) */}
        {org?.currentOrg?.tier === "pro-20240913" && <LegacyProPlanCard />}
        {org?.currentOrg?.tier === "pro-20250202" && <LegacyProPlanCard />}
        {/* New Pro tier (flat $79/mo + $6/GB) */}
        {org?.currentOrg?.tier === "pro-20251210" && <ProPlanCard />}
        {/* Legacy Team tier ($200/mo) */}
        {org?.currentOrg?.tier === "team-20250130" && <LegacyTeamPlanCard />}
        {/* New Team tier ($799/mo + $6/GB) */}
        {org?.currentOrg?.tier === "team-20251210" && <TeamPlanCard />}
        {org?.currentOrg?.tier &&
          !knownTiers.includes(org?.currentOrg?.tier) && (
            <UnknownTierCard tier={org?.currentOrg?.tier} />
          )}
        {org?.currentOrg?.tier === "enterprise" && <EnterprisePlanCard />}
      </Col>
    </>
  );
};

export default BillingPlanPage;
