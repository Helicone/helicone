import { useQuery } from "@tanstack/react-query";
import { getValueParams } from "../lib/valueParams";

/**
 * Custom hook to fetch value parameters.
 * @returns An object containing the fetched value parameters, loading state, and error state.
 */
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
