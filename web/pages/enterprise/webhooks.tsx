import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { useOrg } from "../../components/layout/org/organizationContext";
import DeveloperPage from "../../components/templates/developer/developerPage";
import WebhooksPage from "../../components/templates/webhooks/webhooksPage";
import { useFeatureFlags } from "../../services/hooks/featureFlags";
import { NextPageWithLayout } from "../_app";
import { ContactUsSection } from "../developer/index";

const DeveloperWebhooks: NextPageWithLayout = () => {
  const orgContext = useOrg();
  const { hasFlag } = useFeatureFlags(
    "webhook_beta",
    orgContext?.currentOrg?.id || ""
  );

  return (
    <DeveloperPage title="Developer Webhooks">
      {hasFlag ? <WebhooksPage /> : <ContactUsSection feature="webhook" />}
    </DeveloperPage>
  );
};

DeveloperWebhooks.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default DeveloperWebhooks;
