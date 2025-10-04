import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AreaChart } from "@tremor/react";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { Fragment, useState } from "react";
import { clsx } from "../../../shared/clsx";
import { useGetOrgMembers } from "../../../../services/hooks/organizations";
import { formatISO } from "date-fns";
import { useRequestsOverTime } from "../../organization/plan/renderOrgPlan";
import { useOrg } from "../../../layout/org/organizationContext";
import { useRouter } from "next/router";
import { OrgLimits } from "../../organization/createOrgForm";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { DeleteOrgModal } from "../../organization/deleteOrgModal";
import EditCustomerOrgModal from "./editCustomerOrgModal";
import { Database } from "../../../../db/database.types";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../../organization/orgConstants";

interface CustomerRowProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  refetchCustomerOrgs: () => void;
}

const CustomerRow = (props: CustomerRowProps) => {
  const { org } = props;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const orgContext = useOrg();
  const router = useRouter();

  const { data: members } = useGetOrgMembers(
    org.id,
  );

  const startOfMonthFormatted = formatISO(
    new Date(new Date().setDate(new Date().getDate() - 30)),
    {
      representation: "date",
    },
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
    (icon) => icon.name === org.color,
  );

  return (
    <>
      <TableRow
        onClick={() => {
          router.push(`/enterprise/portal/${org.id}`);
        }}
        className="hover:cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900"
      >
        <TableCell>
          <div className="flex h-8 w-8 flex-none flex-col items-center justify-center rounded-md border border-gray-300 bg-gray-100 object-cover dark:border-gray-700 dark:bg-gray-900">
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
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getUSDateFromString(org.created_at || "")}
          </span>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
          >
            active
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "..." : members?.length}
          </span>
        </TableCell>
        <TableCell>
          <div>
            <AreaChart
              data={chartData}
              categories={["requests"]}
              index={"date"}
              colors={["emerald"]}
              className="-ml-2 h-10 w-48"
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
                className="inline-flex w-full justify-center rounded-lg p-1.5 text-sm font-medium text-white hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 dark:bg-gray-700"
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
              <Menu.Items className="absolute right-0 z-50 mt-2 w-32 origin-top-right rounded-md border border-gray-300 bg-white shadow-lg focus:outline-none dark:border-gray-700 dark:bg-black">
                <div className="px-1 py-1">
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
