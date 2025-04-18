import { NextPageWithLayout } from "../_app";
import { useOrg } from "@/components/layout/org/organizationContext";
import OrgSettingsPage from "@/components/templates/organization/settings/orgSettingsPage";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";

const Settings: NextPageWithLayout<void> = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <OrgSettingsPage org={orgContext.currentOrg} />
  ) : null;
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default Settings;
