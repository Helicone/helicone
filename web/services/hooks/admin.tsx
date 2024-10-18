import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "../../lib/clients/jawn";
import { components } from "../../lib/clients/jawnTypes/private";
import Parser from "rss-parser";

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

const useUpdateSetting = (onSuccess?: () => void) => {
  const { mutate: updateSetting, isLoading: isUpdatingSetting } = useMutation({
    mutationKey: ["update-settings"],
    mutationFn: async (req: {
      name: components["schemas"]["SettingName"];
      settings: components["schemas"]["Setting"];
    }) => {
      const jawnClient = getJawnClient();
      const { data, error } = await jawnClient.POST("/v1/admin/settings", {
        body: {
          name: req.name,
          settings: req.settings,
        },
      });

      console.log(`Updated setting ${req.name}`, data);

      if (!error) {
        onSuccess && onSuccess();
      }

      return { data, error };
    },
  });
  return {
    updateSetting,
    isUpdatingSetting,
  };
};

const useGetSetting = (
  settingName: components["schemas"]["SettingName"],
  onSuccess?: () => void
) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["settings", settingName],
    queryFn: async (query) => {
      const settingName = query
        .queryKey[1] as components["schemas"]["SettingName"];
      const jawnClient = getJawnClient();
      const { data, error } = await jawnClient.GET(
        `/v1/admin/settings/{name}`,
        {
          params: {
            path: {
              name: settingName,
            },
          },
        }
      );

      console.log(`Received setting ${settingName}`, data);
      if (!error) {
        onSuccess && onSuccess();
      }

      return data;
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    setting: data as components["schemas"]["Setting"],
  };
};

const useChangelog = () => {
  const parser = new Parser({
    customFields: {
      item: ["description", "content:encoded", "content:encodedSnippet"],
    },
  });

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["changelog"],
    queryFn: async () => {
      try {
        const feed = await parser.parseURL(
          "https://helicone.ai/rss/changelog.xml"
        );
        return feed.items;
      } catch (err) {
        console.error("Error parsing RSS feed:", err);
        throw err;
      }
    },
  });

  return {
    changelog: data,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
};

export {
  useAlertBanners,
  useCreateAlertBanner,
  useGetSetting,
  useUpdateAlertBanner,
  useUpdateSetting,
  useChangelog,
};
