import {
  CheckIcon,
  ChevronLeftIcon,
  InformationCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  useGetOrg,
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../../../services/hooks/organizations";
import Link from "next/link";
import CreateOrgForm, {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
  OrgLimits,
} from "../../../organization/createOrgForm";
import { getUSDate, getUSDateFromString } from "../../../../shared/utils/utils";
import { clsx } from "../../../../shared/clsx";
import OrgMembersPage from "../../../organization/members/orgMembersPage";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { Tooltip } from "@mui/material";
import { RadioGroup } from "@headlessui/react";
import { SecretInput } from "../../../../shared/themed/themedTable";
import { useVaultPage } from "../../../vault/useVaultPage";
import { useState } from "react";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ProviderKeyList from "./providerKeyList";
import ThemedDrawer from "../../../../shared/themed/themedDrawer";
import { useOrg } from "../../../../shared/layout/organizationContext";
import { useRouter } from "next/router";

interface PortalIdPageProps {
  orgId: string | null;
}

const PortalIdPage = (props: PortalIdPageProps) => {
  const { orgId } = props;

  const { data: org, isLoading, refetch } = useGetOrg(orgId || "");
  const {
    data: members,
    isLoading: isMembersLoading,
    refetch: isRefetching,
  } = useGetOrgMembers(orgId || "");
  const orgContext = useOrg();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);

  const currentIcon = ORGANIZATION_ICONS.find(
    (icon) => icon.name === org?.icon
  );

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === org?.color
  );

  const orgLimits = org?.limits as OrgLimits;
  const owner = members?.data?.find((member) => member.org_role === "owner");

  return (
    <>
      <div className="flex flex-row py-2 space-x-8 w-full">
        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <>
            <div className="flex flex-col items-start space-y-4 w-full max-w-[20rem]">
              <Link
                href={"/enterprise/portal"}
                className="font-semibold text-sm text-sky-500 hover:underline"
              >
                Customer Portal
              </Link>
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 flex-none rounded-md bg-gray-100 dark:bg-gray-900 object-cover border border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
                  {currentIcon && (
                    <currentIcon.icon
                      className={clsx(
                        `text-${currentColor?.name}-500`,
                        "h-6 w-6"
                      )}
                    />
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-black">
                  {org?.name}
                </h1>
              </div>
              <div className="flex flex-row w-full items-center space-x-4 pt-4">
                <button
                  onClick={() => {
                    // set the org id and then redirect the user to the dashboard page
                    if (org) {
                      orgContext?.setCurrentOrg(org.id);
                      router.push("/dashboard");
                    }
                  }}
                  className="flex w-full items-center justify-center px-4 py-2 bg-white dark:bg-black text-black dark:text-white border border-gray-500 text-xs font-semibold rounded-lg"
                >
                  View
                </button>{" "}
                <button
                  onClick={() => {
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center justify-center px-4 py-2 bg-white dark:bg-black text-black dark:text-white border border-gray-500 text-xs font-semibold rounded-lg"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-col space-y-4 divide-y divide-gray-200 w-full pt-4">
                <p className="font-semibold text-md">Limits</p>
                <div className="flex flex-row items-center w-full justify-between space-x-2 pt-4 pr-4">
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Costs</p>
                    <p className="text-sm text-gray-500">{`$${orgLimits?.cost}`}</p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Requests</p>
                    <p className="text-sm text-gray-500">
                      {orgLimits?.requests}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Time Range</p>
                    <p className="text-sm text-gray-500">Monthly</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-4 divide-y divide-gray-200 w-full pt-8">
                <p className="font-semibold text-md">Details</p>
                <div className="flex flex-col pt-4 pr-4 space-y-4">
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Created At</p>
                    <p className="text-sm text-gray-500">
                      {getUSDateFromString(org?.created_at || "")}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Organization ID</p>
                    <p className="text-sm text-gray-500">{org?.id}</p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Owner</p>
                    <p className="text-sm text-gray-500">
                      {owner?.email || "n/a"}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Members</p>
                    <p className="text-sm text-gray-500">
                      {members?.data?.length || "n/a"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full h-full">
              <TabGroup>
                <TabList className="font-semibold" variant="line">
                  <Tab>Members</Tab>
                  <Tab>Keys</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    {org && <OrgMembersPage org={org} wFull={true} />}
                  </TabPanel>
                  <TabPanel>
                    <ProviderKeyList
                      orgProviderKey={org?.org_provider_key || ""}
                    />
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            </div>
          </>
        )}
      </div>
      <ThemedDrawer open={editOpen} setOpen={setEditOpen}>
        <div className="flex flex-col space-y-4">
          <p className="text-2xl font-semibold text-black dark:text-white border-b border-gray-300 dark:border-gray-700 py-4">
            Edit Customer
          </p>
          <CreateOrgForm
            variant="reseller"
            onSuccess={() => {
              setEditOpen(false);
              refetch();
            }}
            initialValues={
              org
                ? {
                    color: org.color,
                    icon: org.icon,
                    name: org.name,
                    id: org.id,
                    limits: org.limits as OrgLimits,
                    providerKey: org.org_provider_key,
                  }
                : undefined
            }
          />
        </div>
      </ThemedDrawer>
    </>
  );
};

export default PortalIdPage;
