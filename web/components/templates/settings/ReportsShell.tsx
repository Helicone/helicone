import { useOrg } from "@/components/layout/org/organizationContext";
import SettingsLayout from "./settingsLayout";
import ReportsPage from "@/components/templates/settings/reportsPage";

const ReportsShell = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <SettingsLayout>
      <ReportsPage />
    </SettingsLayout>
  ) : null;
};

export default ReportsShell;
