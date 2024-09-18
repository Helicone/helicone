import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import OrgSettingsPage from "../../components/templates/organization/settings/orgSettingsPage";
import { useOrg } from "../../components/layout/organizationContext";
import SettingsLayout from "@/components/templates/settings/settingsLayout";

const OrganizationSettings: NextPageWithLayout = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <OrgSettingsPage org={orgContext.currentOrg} />
  ) : null;
};

OrganizationSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default OrganizationSettings;
