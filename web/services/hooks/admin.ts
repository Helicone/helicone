import { useMutation, useQuery } from "@tanstack/react-query";
import Parser from "rss-parser";
import { $JAWN_API, getJawnClient } from "../../lib/clients/jawn";
import { components } from "../../lib/clients/jawnTypes/private";

const useCreateAlertBanner = (onSuccess?: () => void) => {
  const { mutate: createBanner, isPending: isCreatingBanner } = useMutation({
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
  const { mutate: updateBanner, isPending: isUpdatingBanner } = useMutation({
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
  const { mutate: updateSetting, isPending: isUpdatingSetting } = useMutation({
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
          "https://www.helicone.ai/rss/changelog.xml"
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

const useBackfillCosts = (onSuccess?: () => void) => {
  const { mutate: backfillCosts, isPending: isBackfillingCosts } = useMutation({
    mutationKey: ["backfill-costs"],
    mutationFn: async (req: {
      timeExpression: string;
      specifyModel: boolean;
      modelId: string;
      totalChunks: number;
      chunkNumber: number;
    }) => {
      const jawnClient = getJawnClient();
      const { data, error } = await jawnClient.POST(
        "/v1/admin/backfill-costs",
        {
          body: {
            timeExpression: req.timeExpression,
            specifyModel: req.specifyModel,
            modelId: req.modelId,
            totalChunks: req.totalChunks,
            chunkNumber: req.chunkNumber,
          },
        }
      );

      console.log(`Backfilled costs`, data);

      return { data, error };
    },
  });

  return {
    backfillCosts,
    isBackfillingCosts,
  };
};

const useFeatureFlag = (feature: string, orgId: string) => {
  const { data, isLoading, error } = $JAWN_API.useQuery(
    "post",
    "/v1/admin/has-feature-flag",
    {
      body: {
        feature,
        orgId,
      },
    }
  );
  return {
    data,
    isLoading,
    error,
  };
};

export {
  useChangelog,
  useCreateAlertBanner,
  useGetSetting,
  useUpdateAlertBanner,
  useUpdateSetting,
  useBackfillCosts,
  useFeatureFlag,
};
