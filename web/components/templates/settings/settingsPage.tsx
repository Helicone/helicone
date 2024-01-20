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

interface SettingsPageProps {}

const SettingsPage = (props: SettingsPageProps) => {
  const {} = props;

  const orgContext = useOrg();

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-semibold text-3xl text-black dark:text-white">
          Settings
        </h1>
      </div>
      <TabGroup>
        <TabList className="font-semibold" variant="line">
          <Tab icon={BuildingOfficeIcon}>Organization</Tab>
          <Tab icon={CreditCardIcon}>Plan</Tab>
          <Tab icon={UserGroupIcon}>Members</Tab>
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
    </div>
  );
};

export default SettingsPage;
