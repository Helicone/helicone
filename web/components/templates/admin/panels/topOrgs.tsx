import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "../../../../lib/clients/jawn";
import useNotification from "../../../shared/notification/useNotification";

interface TopOrgsProps {}

const TopOrgs = (props: TopOrgsProps) => {
  const {} = props;

  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const { data, isLoading } = useQuery({
    queryKey: ["top_orgs"],
    queryFn: async () => {
      const jawn = getJawnClient();
      return jawn.GET("/v1/admin/orgs/top");
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <h2>Top Organizations</h2>
      {/* {data?.data?.data?.map((org, i) => (
        <div className="flex flex-row gap-2" key={i}>
          <div>{org.organization_id}</div>
          <div>{org.ct}</div>
        </div>
      ))} */}
    </>
  );
};

export default TopOrgs;
