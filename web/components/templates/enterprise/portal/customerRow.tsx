import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Badge, TableCell, TableRow, Text, AreaChart } from "@tremor/react";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { clsx } from "../../../shared/clsx";
import { Database } from "../../../../supabase/database.types";
import { useGetOrgMembers } from "../../../../services/hooks/organizations";
import { formatISO } from "date-fns";
import { useRequestsOverTime } from "../../organization/plan/renderOrgPlan";
import { useOrg } from "../../../shared/layout/organizationContext";
import { useRouter } from "next/router";
import CreateOrgForm, {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
  OrgLimits,
} from "../../organization/createOrgForm";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import { DeleteOrgModal } from "../../organization/deleteOrgModal";

interface CustomerRowProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  refetchCustomerOrgs: () => void;
}

const CustomerRow = (props: CustomerRowProps) => {
  const { org, refetchCustomerOrgs } = props;
  const [deleteHeliconeOpen, setDeleteHeliconeOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const orgContext = useOrg();
  const router = useRouter();

  const { data: members, isLoading: isMembersLoading } = useGetOrgMembers(
    org.id
  );

  // 30 days ago
  const startOfMonthFormatted = formatISO(
    new Date(new Date().setDate(new Date().getDate() - 30)),
    {
      representation: "date",
    }
  );

  const endOfMonthFormatted = formatISO(new Date(), {
    representation: "date",
  });

  const timeFilter: {
    start: Date;
    end: Date;
  } = {
    start: new Date(startOfMonthFormatted),
    end: new Date(endOfMonthFormatted),
  };

  const { data, isLoading, refetch } = useRequestsOverTime({
    timeFilter,
    organizationId: org.id,
  });

  const chartData = data?.data?.map((d: any) => {
    if (new Date(d.time) > new Date()) {
      return {
        requests: null,
        date: new Date(d.time).toLocaleDateString(),
      };
    } else {
      return {
        requests: +d.count,
        date: new Date(d.time).toLocaleDateString(),
      };
    }
  });

  const currentIcon = ORGANIZATION_ICONS.find((icon) => icon.name === org.icon);

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === org.color
  );

  const limits = org.limits as OrgLimits;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="h-8 w-8 flex-none rounded-md bg-gray-100 dark:bg-gray-900 object-cover border border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
            {currentIcon && (
              <currentIcon.icon
                className={clsx(`text-${currentColor?.name}-500`, "h-6 w-6")}
              />
            )}
          </div>

          {/* Add this back in once users can upload assets into their logo_path through the UI */}
          {/* {org.logo_path ? (
          <img
            src={org.logo_path}
            alt={org.name}
            className="h-8 w-8 flex-none rounded-md bg-white object-cover dark:bg-black border border-gray-300 dark:border-gray-700"
          />
        ) : (
          <div className="h-8 w-8 flex-none rounded-md bg-gray-100 dark:bg-gray-900 object-cover border border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
            <UserGroupIcon className="h-4 w-4 text-gray-500" />
          </div>
        )} */}
        </TableCell>
        <TableCell className="font-semibold text-black dark:text-white">
          {org.name}
        </TableCell>
        <TableCell>
          <Text>{getUSDateFromString(org.created_at || "")}</Text>
        </TableCell>
        <TableCell>
          <Badge color="emerald" size="xs" className="text-xs">
            <span className="text-xs">active</span>
          </Badge>
        </TableCell>
        <TableCell>
          <Text>{isLoading ? "..." : members?.data?.length}</Text>
        </TableCell>
        <TableCell>
          <div>
            <AreaChart
              data={chartData}
              categories={["requests"]}
              index={"date"}
              colors={["emerald"]}
              className="h-10 w-48 -ml-2"
              showLegend={false}
              showYAxis={false}
              showXAxis={false}
              showGridLines={false}
              showTooltip={false}
              curveType="monotone"
            />
          </div>
        </TableCell>
        <TableCell>
          <Menu as="div" className="relative ml-auto">
            <Menu.Button className="-m-2.5 block p-2.5 text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300">
              <span className="sr-only">Open options</span>
              <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-10 right-0 mt-0.5 w-fit min-w-[8rem] origin-top-right rounded-md bg-white dark:bg-black py-2 shadow-lg border border-gray-300 dark:border-gray-700 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        // set the org id and then redirect the user to the dashboard page
                        orgContext?.setCurrentOrg(org.id);
                        router.push("/dashboard");
                      }}
                      className={clsx(
                        active
                          ? "bg-gray-50 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-800"
                          : "",
                        "w-full flex px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100"
                      )}
                    >
                      View
                      <span className="sr-only">, {org.name}</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setOpen(true);
                      }}
                      className={clsx(
                        active
                          ? "bg-gray-50 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-800"
                          : "",
                        "w-full flex px-3 py-1 text-sm leading-6 text-gray-900 dark:text-gray-100"
                      )}
                    >
                      Edit
                      <span className="sr-only">, {org.name}</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setDeleteHeliconeOpen(true);
                      }}
                      className={clsx(
                        active
                          ? "bg-gray-50 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-800"
                          : "",
                        "w-full flex px-3 py-1 text-sm leading-6 text-red-500 dark:text-red-500"
                      )}
                    >
                      Delete
                      <span className="sr-only">, {org.name}</span>
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </TableCell>
        <ThemedDrawer open={open} setOpen={setOpen}>
          <div className="flex flex-col space-y-4">
            <p className="text-2xl font-semibold text-black dark:text-white border-b border-gray-300 dark:border-gray-700 py-4">
              Edit Customer
            </p>
            <CreateOrgForm
              variant="reseller"
              onSuccess={() => {
                setOpen(false);
                refetchCustomerOrgs();
              }}
              initialValues={{
                color: org.color,
                icon: org.icon,
                name: org.name,
                id: org.id,
                limits: limits,
                providerKey: org.org_provider_key,
                isOwner: true,
              }}
            />
          </div>
        </ThemedDrawer>
        <DeleteOrgModal
          open={deleteHeliconeOpen}
          setOpen={setDeleteHeliconeOpen}
          orgId={org.id}
          orgName={org.name}
        />
      </TableRow>
    </>
  );
};

export default CustomerRow;
