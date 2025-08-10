import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import GatewayPage from "../../components/templates/gateway/gatewayPage";

const AIGatewaySettings: NextPageWithLayout<void> = () => {
  return <GatewayPage />;
};

AIGatewaySettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default AIGatewaySettings;
