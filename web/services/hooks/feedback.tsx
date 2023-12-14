import { useQuery } from "@tanstack/react-query";
import { getFeedback } from "../lib/feedback";

interface Feedback {
  name: string;
  dataType: string;
}

/**
 * Custom hook to fetch feedback data.
 * @returns {Object} An object containing feedback data, loading state, and error state.
 * @property {Feedback[]} feedback - An array of feedback objects.
 * @property {boolean} isLoading - A boolean indicating if the data is currently being loaded.
 * @property {Error | null} error - An error object if there was an error while fetching the data, otherwise null.
 */
const useGetFeedback = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      return getFeedback().then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  const allFeedback: Feedback[] = data ?? [];

  return {
    feedback: allFeedback || [],
    isLoading,
    error,
  };
};

export { useGetFeedback };
