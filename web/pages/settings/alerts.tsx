import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import AlertsPage from "../../components/templates/alerts/alertsPage";

const AlertsSettings: NextPageWithLayout<void> = () => {
  return <AlertsPage />;
};

AlertsSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default AlertsSettings;