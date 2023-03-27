import { useQuery } from "@tanstack/react-query";
import { Property } from "../../lib/api/properties/properties";
import { getProperties } from "../lib/properties";
import { getPropertyParams } from "../lib/propertyParams";
import { getValueParams } from "../lib/valueParams";

export const useGetValueParams = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["valueParams"],
    queryFn: async () => {
      return getValueParams().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });
  const valueParams = data?.data ?? [];

  return { valueParams, isLoading, error };
};
