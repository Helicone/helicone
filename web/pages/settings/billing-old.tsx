import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import OrgPlanPage from "../../components/templates/organization/plan/orgPlanPage";
import { useOrg } from "../../components/layout/organizationContext";
import SettingsLayout from "@/components/templates/settings/settingsLayout";

const PlanSettings: NextPageWithLayout = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <OrgPlanPage org={orgContext.currentOrg} />
  ) : null;
};

PlanSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default PlanSettings;
