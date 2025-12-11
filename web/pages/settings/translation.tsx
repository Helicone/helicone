import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import TranslationSettingsPage from "@/components/templates/settings/translationSettingsPage";

const TranslationSettings: NextPageWithLayout<void> = () => {
  return <TranslationSettingsPage />;
};

TranslationSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default TranslationSettings;
