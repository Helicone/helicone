import { useQuery } from "@tanstack/react-query";
import { Property } from "../../lib/api/properties/properties";
import { getProperties } from "../lib/properties";
import { getPropertyParams } from "../lib/propertyParams";

const useGetPropertyParams = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["propertyParams"],
    queryFn: async () => {
      return getPropertyParams().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });
  const propertyParams = data?.data ?? [];

  return { propertyParams, isLoading, error };
};

export { useGetPropertyParams };
