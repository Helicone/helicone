import { useOrg } from "@/components/layout/org/organizationContext";
import SettingsLayout from "./settingsLayout";
import RateLimitPage from "@/components/templates/settings/rateLimitPage";

const RateLimitsShell = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <SettingsLayout>
      <RateLimitPage />
    </SettingsLayout>
  ) : null;
};

export default RateLimitsShell;
