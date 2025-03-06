import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";

export interface PropertyKey {
  property: string;
  count?: number;
}

export function usePropertyKeys() {
  const jawn = useJawnClient();

  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await jawn.POST("/v1/property/query", {
        body: {},
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data?.data as PropertyKey[];
    },
    refetchOnWindowFocus: false,
  });
}
