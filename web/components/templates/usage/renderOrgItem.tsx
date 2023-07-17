import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, formatISO } from "date-fns";
import { useEffect } from "react";
import { useGetRequestCountClickhouse } from "../../../services/hooks/requests";

interface RenderOrgItemProps {
  org: {
    color: string;
    created_at: string | null;
    has_onboarded: boolean;
    icon: string;
    id: string;
    is_personal: boolean;
    name: string;
    owner: string;
    soft_delete: boolean;
  };
  currentMonth: Date;
}

const RenderOrgItem = (props: RenderOrgItemProps) => {
  const { org, currentMonth } = props;

  const startOfMonthFormatted = formatISO(currentMonth, {
    representation: "date",
  });
  const endOfMonthFormatted = formatISO(endOfMonth(currentMonth), {
    representation: "date",
  });

  const { count, isLoading, refetch } = useGetRequestCountClickhouse(
    startOfMonthFormatted,
    endOfMonthFormatted,
    org.id
  );

  useEffect(() => {
    refetch();
  }, [currentMonth, refetch]);

  return (
    <>
      {isLoading ? (
        <p className="py-2">Loading...</p>
      ) : (
        <li className="flex flex-row justify-between items-center pt-3">
          <p className="font-semibold text-gray-900 text-md">{org.name}</p>
          <p className="text-gray-600 text-md">{count.data}</p>
        </li>
      )}
    </>
  );
};

export default RenderOrgItem;
