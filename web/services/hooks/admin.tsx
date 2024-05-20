import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import useNotification from "../../components/shared/notification/useNotification";

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
  const supabaseClient = useSupabaseClient();
  const { mutate: createBanner, isLoading: isCreatingBanner } = useMutation({
    mutationKey: ["create-alert-banner"],
    mutationFn: async (req: { title: string; message: string }) => {
      const { data, error } = await supabaseClient
        .from("alert_banners")
        .insert({
          title: req.title,
          message: req.message,
          active: false,
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
  const supabaseClient = useSupabaseClient();
  const { setNotification } = useNotification();

  const { mutate: updateBanner, isLoading: isUpdatingBanner } = useMutation({
    mutationKey: ["update-alert-banner"],
    mutationFn: async (req: { id: number; active: boolean }) => {
      const { data: alertBanners } = await supabaseClient
        .from("alert_banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (req.active) {
        // check if there is already an active banner. If so, throw an error and return
        const activeBanner = alertBanners?.find((banner) => banner.active);
        if (activeBanner) {
          setNotification(
            "There is already an active banner. Please deactivate it first",
            "error"
          );
          return;
        }
      }
      const { data, error } = await supabaseClient
        .from("alert_banners")
        .update({
          active: req.active,
        })
        .match({ id: req.id });

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
