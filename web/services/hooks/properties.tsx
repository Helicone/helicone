import { useQuery } from "@tanstack/react-query";
import { Property } from "../../lib/api/properties/properties";
import { getProperties } from "../lib/properties";

const useGetProperties = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      return getProperties().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  return { properties: (data?.data as string[]) || [], isLoading, error };
};

export { useGetProperties };
