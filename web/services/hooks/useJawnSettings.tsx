import { useQuery } from "@tanstack/react-query";

import { useJawnClient } from "../../lib/clients/jawnHook";

const useJawnSettings = () => {
  const jawn = useJawnClient();
  return useQuery({
    queryKey: ["jawn_settings", jawn],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;

      return jawn.GET("/v1/settings/query");
    },
    refetchOnWindowFocus: false,
  });
};

export { useJawnSettings };
