import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AddKeyObj, addKey } from "../lib/keys";

/**
 * Custom hook for adding a key.
 * @returns An object containing the `addKey` function, `isLoading` boolean, and `error` object.
 */
const useAddKey = () => {
  const client = useSupabaseClient();
  const queryClient = useQueryClient();

  const { mutate, isLoading, error } = useMutation({
    mutationKey: ["addKey"],
    mutationFn: async (key: AddKeyObj) => {
      return addKey(client, key).then((res) => res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keys"] });
    },
  });

  return {
    addKey: mutate,
    isLoading,
    error,
  };
};

export { useAddKey };
