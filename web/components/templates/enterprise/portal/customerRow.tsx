import { Badge, TableCell, TableRow, Text, AreaChart } from "@tremor/react";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { Fragment, useState } from "react";
import { clsx } from "../../../shared/clsx";
import { useGetOrgMembers } from "../../../../services/hooks/organizations";
import { formatISO } from "date-fns";
import { useRequestsOverTime } from "../../organization/plan/renderOrgPlan";
import { useOrg } from "../../../layout/organizationContext";
import { useRouter } from "next/router";
import { OrgLimits } from "../../organization/createOrgForm";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { DeleteOrgModal } from "../../organization/deleteOrgModal";
import EditCustomerOrgModal from "./editCustomerOrgModal";
import { Database } from "../../../../supabase/database.types";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../../organization/orgConstants";

interface CustomerRowProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  refetchCustomerOrgs: () => void;
}

const CustomerRow = (props: CustomerRowProps) => {
  const { org, refetchCustomerOrgs } = props;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const orgContext = useOrg();
  const router = useRouter();

  const { data: members, isLoading: isMembersLoading } = useGetOrgMembers(
    org.id
  );

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

  return (
    <>
      <TableRow
        onClick={() => {
          router.push(`/enterprise/portal/${org.id}`);
        }}
        className="hover:bg-gray-100 dark:hover:bg-gray-900 hover:cursor-pointer"
      >
        <TableCell>
          <div className="h-8 w-8 flex-none rounded-md bg-gray-100 dark:bg-gray-900 object-cover border border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
            {currentIcon && (
              <currentIcon.icon
                className={clsx(`text-${currentColor?.name}-500`, "h-6 w-6")}
              />
            )}
          </div>
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
          <Text>{isLoading ? "..." : members?.length}</Text>
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
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button
                onClick={(e: any) => {
                  e.stopPropagation();
                }}
                className="inline-flex w-full justify-center rounded-lg p-1.5 text-sm font-medium text-white hover:bg-gray-300 dark:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
              >
                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="z-50 border border-gray-300 dark:border-gray-700 absolute right-0 mt-2 w-32 origin-top-right rounded-md bg-white dark:bg-black shadow-lg focus:outline-none">
                <div className="px-1 py-1 ">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active
                            ? "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                            : "text-black dark:text-white"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          orgContext?.setCurrentOrg(org.id);
                          router.push("/dashboard");
                        }}
                      >
                        View
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active
                            ? "bg-gray-300 text-black dark:bg-gray-700 dark:text-white"
                            : "text-black dark:text-white"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        onClick={(e) => {
                          // open the edit form
                          e.stopPropagation();
                          setEditOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active
                            ? "bg-gray-300 text-black dark:bg-gray-700 dark:text-white"
                            : "text-black dark:text-white"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteOpen(true);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </TableCell>
      </TableRow>
      <EditCustomerOrgModal
        open={editOpen}
        setOpen={setEditOpen}
        onSuccess={() => {
          refetch();
        }}
        initialValues={{
          color: org?.color || "",
          icon: org?.icon || "",
          name: org?.name || "",
          id: org?.id || "",
          limits: org?.limits as OrgLimits,
          providerKey: org?.org_provider_key || "",
        }}
      />
      <DeleteOrgModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        orgId={org.id}
        orgName={org.name}
        onDeleteRoute={"/enterprise/portal"}
      />
    </>
  );
};

export default CustomerRow;
