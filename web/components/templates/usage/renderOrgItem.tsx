import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
}

const RenderOrgItem = (props: RenderOrgItemProps) => {
  const { org } = props;

  const { count, isLoading } = useGetRequestCountClickhouse(
    format(new Date(), "yyyy-MM-01"),
    format(new Date(), "yyyy-MM-dd"),
    org.id
  );
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
