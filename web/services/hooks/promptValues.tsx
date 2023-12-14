import { useQuery } from "@tanstack/react-query";
import { Value } from "../../lib/api/prompts/prompts";
import { getPromptValues } from "../lib/promptValues";

/**
 * Custom hook to fetch prompt values.
 * @returns An object containing the fetched values, loading state, and error state.
 */
const useGetPromptValues = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["promptValues"],
    queryFn: async () => {
      return getPromptValues().then((res) => res);
    },
  });

  const allValues: string[] = data?.data.map((value: Value) => {
    return value.value;
  });

  return { values: allValues || [], isLoading, error };
};

export { useGetPromptValues };
