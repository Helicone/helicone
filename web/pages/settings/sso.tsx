import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import SSOSettingsPage from "@/components/templates/organization/sso/ssoSettingsPage";

const SSOSettings: NextPageWithLayout<void> = () => {
  return (
    <div className="flex w-full max-w-6xl flex-col border-y border-border">
      <SSOSettingsPage />
    </div>
  );
};

SSOSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default SSOSettings;
