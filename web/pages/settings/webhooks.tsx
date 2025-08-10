import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import WebhooksPage from "../../components/templates/webhooks/webhooksPage";

const WebhooksSettings: NextPageWithLayout<void> = () => {
  return <WebhooksPage />;
};

WebhooksSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default WebhooksSettings;
