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

interface CustomerRowProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  refetchCustomerOrgs: () => void;
}

const CustomerRow = (props: CustomerRowProps) => {
  const { org, refetchCustomerOrgs } = props;

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
      <TableRow
        onClick={() => {
          router.push(`/enterprise/portal/${org.id}`);
        }}
        className="hover:bg-gray-100 hover:cursor-pointer"
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
      </TableRow>
    </>
  );
};

export default CustomerRow;
