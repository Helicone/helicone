import { useOrg } from "@/components/layout/org/organizationContext";
import SettingsLayout from "./settingsLayout";
import OrgSettingsPage from "@/components/templates/organization/settings/orgSettingsPage";

const OrganizationShell = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <SettingsLayout>
      <OrgSettingsPage org={orgContext.currentOrg} />
    </SettingsLayout>
  ) : null;
};

export default OrganizationShell;
