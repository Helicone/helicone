import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import {
  SettingsContainer,
  SettingsSectionHeader,
  SettingsSectionContent,
} from "@/components/ui/settings-container";
import { ProviderKeySettings } from "@/components/templates/settings/providerKeySettings";

const ProvidersSettings: NextPageWithLayout<void> = () => {
  return (
    <SettingsContainer>
      <SettingsSectionHeader
        title="Providers"
        description="Configure your API keys for different LLM providers"
      />

      <SettingsSectionContent>
        <ProviderKeySettings />
      </SettingsSectionContent>
    </SettingsContainer>
  );
};

ProvidersSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default ProvidersSettings;
