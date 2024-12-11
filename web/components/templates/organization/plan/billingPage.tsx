import { useOrg } from "@/components/layout/org/organizationContext";
import AuthHeader from "@/components/shared/authHeader";
import { Col } from "@/components/layout/common";
import { FreePlanCard } from "./freeBillingPage";
import { ProPlanCard } from "./proBillingPage";
import { MigrateGrowthToPro } from "./MigrateGrowthToPro";
import { UnknownTierCard } from "./UnknownTierCard";
import { EnterprisePlanCard } from "./EnterprisePlanCard";

interface OrgPlanPageProps {}

const BillingPlanPage = (props: OrgPlanPageProps) => {
  const org = useOrg();

  const knownTiers = ["free", "pro-20240913", "growth", "enterprise"];

  return (
    <>
      <AuthHeader
        title={<div className="flex items-center gap-2">Billing</div>}
      />
      <Col className="gap-4">
        {org?.currentOrg?.tier === "growth" && <MigrateGrowthToPro />}
        {org?.currentOrg?.tier === "free" && <FreePlanCard />}
        {org?.currentOrg?.tier === "pro-20240913" && <ProPlanCard />}
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
