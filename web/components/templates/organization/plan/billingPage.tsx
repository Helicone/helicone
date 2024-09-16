import { useOrg } from "@/components/layout/organizationContext";
import AuthHeader from "@/components/shared/authHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Col } from "@/components/layout/common";
import { FreePlanCard } from "./freeBillingPage";
import { ProPlanCard } from "./proBillingPage";
import { MigrateGrowthToPro } from "./MigrateGrowthToPro";
import { UnknownTierCard } from "./UnknownTierCard";

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
        <Card className="bg-[#F9F9F9] p-4 max-w-lg">
          <div className="text-[#334155] font-medium">
            Looking for something else?
          </div>
          <h1 className="text-[#000000] font-bold text-3xl mt-4">Contact us</h1>
          <h2 className="text-[#334155] font-light text-md">
            Observability needs, support, or just want to say hi?
          </h2>
          <Button className="mt-4">Contact us</Button>
        </Card>
      </Col>
    </>
  );
};

export default BillingPlanPage;
