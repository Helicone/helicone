import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import SSOSettingsPage from "@/components/templates/organization/settings/ssoSettingsPage";
import { NextPageWithLayout } from "../_app";

const SSOSettings: NextPageWithLayout = () => {
  return <SSOSettingsPage />;
};

SSOSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default SSOSettings;
