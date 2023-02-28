import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUSDate } from "../../components/shared/utils/utils";
import { Database } from "../../supabase/database.types";
import { addKey, AddKeyObj, deleteKey, getKeys } from "../lib/keys";

const useGetKeys = () => {
  const client = useSupabaseClient();

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ["keys"],
    queryFn: async () => {
      return getKeys(client).then((res) => res);
    },
    refetchOnWindowFocus: false,
  });

  if (data?.data) {
    data.data.forEach((key) => {
      if (key.key_name === null) {
        key.key_name = "n/a";
      }
      key.created_at = getUSDate(new Date(key.created_at).toLocaleString());
    });
  }

  return {
    keys:
      (data?.data as Database["public"]["Tables"]["user_api_keys"]["Row"][]) ||
      [],
    count: data?.count || 0,
    isLoading: isLoading || isRefetching,
    refetch,
    error,
  };
};

const useDeleteKey = () => {
  const client = useSupabaseClient();
  const queryClient = useQueryClient();

  const { mutate, isLoading, error } = useMutation({
    mutationKey: ["deleteKey"],
    mutationFn: async (apiKeyHash: string) => {
      return deleteKey(client, apiKeyHash).then((res) => res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keys"] });
    },
  });

  return {
    deleteKey: mutate,
    isLoading,
    error,
  };
};

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

export { useGetKeys, useDeleteKey, useAddKey };
