import {
  LockClosedIcon,
  GlobeAltIcon,
  CodeBracketSquareIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { useOrg } from "../../shared/layout/organizationContext";
import KeyPage from "../keys/keyPage";
import GraphQLPage from "../graphql/graphqlPage";
import WebhooksPage from "../webhooks/webhooksPage";
import { useUser } from "@supabase/auth-helpers-react";
import VaultPage from "../vault/vaultPage";
import { useFeatureFlags } from "../../../services/hooks/featureFlags";

interface DeveloperPageProps {}

const DeveloperPage = (props: DeveloperPageProps) => {
  const {} = props;

  const orgContext = useOrg();

  const user = useUser();

  const { hasFlag } = useFeatureFlags(
    "webhook_beta",
    orgContext?.currentOrg?.id || ""
  );

  const tier = orgContext?.currentOrg?.tier;

  const isPaidPlan = tier === "pro" || tier === "enterprise";

  const renderConditionalTabs = () => {
    if (hasFlag && isPaidPlan) {
      return (
        <>
          <TabPanel>
            <div className="p-4">
              <WebhooksPage user={user!} />
            </div>
          </TabPanel>{" "}
          <TabPanel>
            <VaultPage />
          </TabPanel>
        </>
      );
    }
    if (hasFlag) {
      return (
        <>
          <TabPanel>
            <div className="p-4">
              <WebhooksPage user={user!} />
            </div>
          </TabPanel>
        </>
      );
    }
    if (isPaidPlan) {
      return (
        <>
          <TabPanel>
            <VaultPage />
          </TabPanel>
        </>
      );
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-semibold text-3xl text-black dark:text-white">
          Developer
        </h1>
      </div>
      <TabGroup>
        <TabList className="font-semibold" variant="line">
          <Tab icon={KeyIcon}>Keys</Tab>
          <Tab icon={CodeBracketSquareIcon}>GraphQL</Tab>
          {hasFlag ? <Tab icon={GlobeAltIcon}>Webhooks</Tab> : <></>}
          {isPaidPlan ? <Tab icon={LockClosedIcon}>Vault</Tab> : <></>}
        </TabList>
        <TabPanels>
          <TabPanel>
            <KeyPage />
          </TabPanel>
          <TabPanel>
            <div className="p-4">
              <GraphQLPage />
            </div>
          </TabPanel>
          {renderConditionalTabs()}
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default DeveloperPage;
