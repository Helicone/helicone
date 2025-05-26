import { useOrg } from "@/components/layout/org/organizationContext";
import OrgSettingsPage from "@/components/templates/organization/settings/orgSettingsPage";
import SettingsLayout from "./settingsLayout";

const SettingsPageShell = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <SettingsLayout>
      <OrgSettingsPage org={orgContext.currentOrg} />
    </SettingsLayout>
  ) : null;
};

export default SettingsPageShell;
