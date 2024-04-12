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
import { ElementType } from "react";
import { useRouter } from "next/router";
import AuthHeader from "../../shared/authHeader";

interface DeveloperPageProps {
  defaultIndex?: number;
}

const tabs: {
  id: number;
  title: string;
  icon: ElementType<any>;
}[] = [
  {
    id: 0,
    title: "Keys",
    icon: KeyIcon,
  },
  {
    id: 1,
    title: "GraphQL",
    icon: CodeBracketSquareIcon,
  },
  {
    id: 2,
    title: "Webhooks",
    icon: GlobeAltIcon,
  },
  {
    id: 3,
    title: "Vault",
    icon: LockClosedIcon,
  },
];

const DeveloperPage = (props: DeveloperPageProps) => {
  const { defaultIndex = 0 } = props;

  const orgContext = useOrg();

  const user = useUser();

  const router = useRouter();

  const { hasFlag } = useFeatureFlags(
    "webhook_beta",
    orgContext?.currentOrg?.id || ""
  );

  const tier = orgContext?.currentOrg?.tier;

  const isPaidPlan = tier !== "free";

  return (
    <>
      <AuthHeader title={"Developer"} />
      <TabGroup defaultIndex={defaultIndex}>
        <TabList className="font-semibold" variant="line">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              onClick={() => {
                router.push(
                  {
                    query: { tab: tab.id },
                  },
                  undefined,
                  { shallow: true }
                );
              }}
            >
              {tab.title}
            </Tab>
          ))}
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
                  <div className="flex flex-col w-full">
                    <GlobeAltIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                    <p className="text-xl text-black dark:text-white font-semibold mt-8">
                      We&apos;d love to learn more about your use case
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm mt-2">
                      Please get in touch with us to discuss our webhook
                      feature.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="https://cal.com/team/helicone/helicone-discovery"
                        target="_blank"
                        rel="noreferrer"
                        className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        Contact Us
                      </Link>
                    </div>
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
                <div className="flex flex-col w-full">
                  <GlobeAltIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                  <p className="text-xl text-black dark:text-white font-semibold mt-8">
                    We&apos;d love to learn more about your use case
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mt-2">
                    Please get in touch with us to discuss our vault feature.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="https://cal.com/team/helicone/helicone-discovery"
                      target="_blank"
                      rel="noreferrer"
                      className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </>
  );
};

export default DeveloperPage;
