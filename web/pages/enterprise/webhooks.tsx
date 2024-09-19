import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import DeveloperPage from "../../components/templates/developer/developerPage";
import WebhooksPage from "../../components/templates/webhooks/webhooksPage";
import { useUser } from "@supabase/auth-helpers-react";
import { useFeatureFlags } from "../../services/hooks/featureFlags";
import { useOrg } from "../../components/layout/organizationContext";
import { ContactUsSection } from "../developer/index";

const DeveloperWebhooks: NextPageWithLayout = () => {
  const user = useUser();
  const orgContext = useOrg();
  const { hasFlag } = useFeatureFlags(
    "webhook_beta",
    orgContext?.currentOrg?.id || ""
  );

  return (
    <DeveloperPage title="Developer Webhooks">
      {hasFlag ? (
        <WebhooksPage user={user!} />
      ) : (
        <ContactUsSection feature="webhook" />
      )}
    </DeveloperPage>
  );
};

DeveloperWebhooks.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default DeveloperWebhooks;
