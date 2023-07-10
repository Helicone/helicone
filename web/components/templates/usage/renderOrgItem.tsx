import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

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

  function getBeginningOfMonth() {
    const today = new Date();
    const firstDateOfMonth = format(today, "yyyy-MM-01");
    return firstDateOfMonth;
  }

  const { data, isLoading } = useQuery({
    queryKey: [`orgItem-${org.id}`],
    queryFn: async (query) => {
      const data = await fetch(`/api/request/ch/count?org_id=${org.id}`, {
        method: "POST",
        body: JSON.stringify({
          filter: {
            left: {
              response_copy_v3: {
                request_created_at: {
                  gte: getBeginningOfMonth(),
                },
              },
            },
            operator: "and",
            right: "all",
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());
      return data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      {isLoading ? (
        <p className="py-2">Loading...</p>
      ) : (
        <li className="flex flex-row justify-between items-center pt-3">
          <p className="font-semibold text-gray-900 text-md">{org.name}</p>
          <p className="text-gray-600 text-md">{data.data}</p>
        </li>
      )}
    </>
  );
};

export default RenderOrgItem;
