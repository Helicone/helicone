import {
  LockClosedIcon,
  GlobeAltIcon,
  CodeBracketSquareIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { useOrg } from "../../layout/organizationContext";
import KeyPage from "../keys/keyPage";
import GraphQLPage from "../graphql/graphqlPage";
import WebhooksPage from "../webhooks/webhooksPage";
import { useUser } from "@supabase/auth-helpers-react";
import VaultPage from "../vault/vaultPage";
import { useFeatureFlags } from "../../../services/hooks/featureFlags";
import Link from "next/link";

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
          <Tab icon={GlobeAltIcon}>Webhooks</Tab>
          <Tab icon={LockClosedIcon}>Vault</Tab>
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
          <TabPanel>
            <div className="p-4">
              {hasFlag ? (
                <WebhooksPage user={user!} />
              ) : (
                <div className="flex flex-col w-full h-96 justify-center items-center">
                  <div className="flex flex-col w-2/5">
                    <GlobeAltIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                    <p className="text-xl text-black dark:text-white font-semibold mt-8">
                      Webhooks are an enterprise feature
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm mt-2">
                      Please reach out to us at{" "}
                      <Link
                        href="mailto:sales@helicone.ai"
                        className="underline text-blue-500"
                      >
                        sales@helicone.ai
                      </Link>{" "}
                      to get access to this feature.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabPanel>
          <TabPanel>
            {isPaidPlan ? (
              <VaultPage />
            ) : (
              <div className="flex flex-col w-full h-96 justify-center items-center">
                <div className="flex flex-col w-2/5">
                  <GlobeAltIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                  <p className="text-xl text-black dark:text-white font-semibold mt-8">
                    Vault is an enterprise feature
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mt-2">
                    Please reach out to us at{" "}
                    <Link
                      href="mailto:sales@helicone.ai"
                      className="underline text-blue-500"
                    >
                      sales@helicone.ai
                    </Link>{" "}
                    to get access to this feature.
                  </p>
                </div>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default DeveloperPage;
