import { useOrg } from "@/components/layout/org/organizationContext";
import SettingsLayout from "./settingsLayout";
import OrgMembersPage from "../organization/members/orgMembersPage";

const MembersShell = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <SettingsLayout>
      <OrgMembersPage org={orgContext.currentOrg} />
    </SettingsLayout>
  ) : null;
};

export default MembersShell;
