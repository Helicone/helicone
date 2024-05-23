import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import useNotification from "../../components/shared/notification/useNotification";
import { getJawnClient } from "../../lib/clients/jawn";

const useAlertBanners = () => {
  const supabaseClient = useSupabaseClient();
  const {
    data: alertBanners,
    isLoading: isAlertBannersLoading,
    refetch,
  } = useQuery({
    queryKey: ["alert-banners"],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("alert_banners")
        .select("*")
        .order("created_at", { ascending: false });

      return { data, error };
    },
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  return {
    alertBanners,
    isAlertBannersLoading,
    refetch,
  };
};

const useCreateAlertBanner = (onSuccess?: () => void) => {
  const { mutate: createBanner, isLoading: isCreatingBanner } = useMutation({
    mutationKey: ["create-alert-banner"],
    mutationFn: async (req: { title: string; message: string }) => {
      const jawnClient = getJawnClient();
      const { data, error } = await jawnClient.POST("/v1/admin/alert_banners", {
        body: req,
      });

      if (!error) {
        onSuccess && onSuccess();
      }

      return { data, error };
    },
  });
  return {
    createBanner,
    isCreatingBanner,
  };
};

const useUpdateAlertBanner = (onSuccess?: () => void) => {
  const { mutate: updateBanner, isLoading: isUpdatingBanner } = useMutation({
    mutationKey: ["update-alert-banner"],
    mutationFn: async (req: { id: number; active: boolean }) => {
      const jawnClient = getJawnClient();
      const { data, error } = await jawnClient.PATCH(
        "/v1/admin/alert_banners",
        {
          body: req,
        }
      );

      if (!error) {
        onSuccess && onSuccess();
      }

      return { data, error };
    },
  });
  return {
    updateBanner,
    isUpdatingBanner,
  };
};

export { useAlertBanners, useCreateAlertBanner, useUpdateAlertBanner };
