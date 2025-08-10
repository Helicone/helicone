import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import OrgMembersPage from "../../components/templates/organization/members/orgMembersPage";
import { useOrg } from "../../components/layout/org/organizationContext";
import SettingsLayout from "@/components/templates/settings/settingsLayout";

const MembersSettings: NextPageWithLayout<void> = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <div className="flex w-full max-w-6xl flex-col border border-border bg-background">
      <OrgMembersPage org={orgContext.currentOrg} wFull />
    </div>
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
