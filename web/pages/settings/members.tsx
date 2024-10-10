import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import OrgMembersPage from "../../components/templates/organization/members/orgMembersPage";
import { useOrg } from "../../components/layout/organizationContext";
import SettingsLayout from "@/components/templates/settings/settingsLayout";

const MembersSettings: NextPageWithLayout = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <OrgMembersPage org={orgContext.currentOrg} />
  ) : null;
};

MembersSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default MembersSettings;
