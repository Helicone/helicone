import { useQuery } from "@tanstack/react-query";
import { getFeedback } from "../lib/feedback";

interface Feedback {
  name: string;
  dataType: string;
}

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
