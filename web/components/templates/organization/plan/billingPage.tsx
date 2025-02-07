import { useOrg } from "@/components/layout/org/organizationContext";
import AuthHeader from "@/components/shared/authHeader";
import { Col } from "@/components/layout/common";
import { FreePlanCard } from "./freeBillingPage";
import { ProPlanCard } from "./proBillingPage";
import { MigrateGrowthToPro } from "./MigrateGrowthToPro";
import { UnknownTierCard } from "./UnknownTierCard";
import { EnterprisePlanCard } from "./EnterprisePlanCard";
import { TeamPlanCard } from "./teamBillingPage";

interface OrgPlanPageProps {}

const BillingPlanPage = (props: OrgPlanPageProps) => {
  const org = useOrg();

  const knownTiers = [
    "free",
    "pro-20240913",
    "pro-20250202",
    "growth",
    "enterprise",
    "team-20250130",
  ];

  return (
    <>
      <Col className="gap-4">
        {org?.currentOrg?.tier === "growth" && <MigrateGrowthToPro />}
        {org?.currentOrg?.tier === "free" && <FreePlanCard />}
        {org?.currentOrg?.tier === "pro-20240913" && <ProPlanCard />}
        {org?.currentOrg?.tier === "pro-20250202" && <ProPlanCard />}
        {org?.currentOrg?.tier === "team-20250130" && <TeamPlanCard />}
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
