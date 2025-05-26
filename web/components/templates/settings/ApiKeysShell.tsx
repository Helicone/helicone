import { useOrg } from "@/components/layout/org/organizationContext";
import SettingsLayout from "./settingsLayout";
import KeyPage from "@/components/templates/keys/keyPage";

const ApiKeysShell = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <SettingsLayout>
      <KeyPage />
    </SettingsLayout>
  ) : null;
};

export default ApiKeysShell;
