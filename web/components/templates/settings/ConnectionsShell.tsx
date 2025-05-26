import { useOrg } from "@/components/layout/org/organizationContext";
import SettingsLayout from "./settingsLayout";
import ConnectionsPage from "@/components/templates/connections/connectionsPage";

const ConnectionsShell = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <SettingsLayout>
      <ConnectionsPage />
    </SettingsLayout>
  ) : null;
};

export default ConnectionsShell;
