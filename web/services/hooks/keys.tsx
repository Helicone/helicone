import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { getKeys } from "../lib/keys";

const useKeys = () => {
  const client = useSupabaseClient();

  const {} = useQuery({
    queryKey: ["keys"],
    queryFn: async (query) => {
      return getKeys(client).then((res) => res);
    },
  });
};

export { useKeys };
