import {
  UserGroupIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { useOrg } from "../../layout/organizationContext";
import OrgSettingsPage from "../organization/settings/orgSettingsPage";
import OrgPlanPage from "../organization/plan/orgPlanPage";
import OrgMembersPage from "../organization/members/orgMembersPage";
import { ElementType } from "react";
import { useRouter } from "next/router";
import AuthHeader from "../../shared/authHeader";

interface SettingsPageProps {
  defaultIndex?: number;
}

const tabs: {
  id: number;
  title: string;
  icon: ElementType<any>;
}[] = [
  {
    id: 0,
    title: "Organization",
    icon: BuildingOfficeIcon,
  },
  {
    id: 1,
    title: "Plan",
    icon: CreditCardIcon,
  },
  {
    id: 2,
    title: "Members",
    icon: UserGroupIcon,
  },
];

const SettingsPage = (props: SettingsPageProps) => {
  const { defaultIndex = 0 } = props;

  const orgContext = useOrg();
  const router = useRouter();

  return (
    <>
      <AuthHeader title="Settings" />
      <TabGroup>
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
              <span>{tab.title}</span>
            </Tab>
          ))}
        </TabList>
        {orgContext?.currentOrg ? (
          <TabPanels>
            <TabPanel>
              <OrgSettingsPage org={orgContext?.currentOrg} />
            </TabPanel>
            <TabPanel>
              <OrgPlanPage org={orgContext?.currentOrg} />
            </TabPanel>
            <TabPanel>
              <OrgMembersPage org={orgContext?.currentOrg} />
            </TabPanel>
          </TabPanels>
        ) : (
          <></>
        )}
      </TabGroup>
    </>
  );
};

export default SettingsPage;
