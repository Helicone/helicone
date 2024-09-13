import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import OrgMembersPage from "../../components/templates/organization/members/orgMembersPage";
import { useOrg } from "../../components/layout/organizationContext";

const MembersSettings: NextPageWithLayout = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <OrgMembersPage org={orgContext.currentOrg} />
  ) : null;
};

MembersSettings.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default MembersSettings;
