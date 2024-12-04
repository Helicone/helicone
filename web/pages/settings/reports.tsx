import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import ReportsPage from "@/components/templates/settings/reportsPage";
import SettingsLayout from "@/components/templates/settings/settingsLayout";

const ReportsSettings: NextPageWithLayout = () => {
  return <ReportsPage />;
};

ReportsSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default ReportsSettings;
