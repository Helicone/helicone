import {
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import { getUSDateFromString } from "../../shared/utils/utils";
import AddWebhookForm from "./addWebhookForm";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";

// Import ShadcnUI components
import AuthHeader from "@/components/shared/authHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getJawnClient } from "@/lib/clients/jawn";
import { ExternalLinkIcon } from "lucide-react";
import { PiWebhooksLogo } from "react-icons/pi";

interface WebhooksPageProps {
  user: User;
}

const WebhooksPage = (props: WebhooksPageProps) => {
  const client = useSupabaseClient<Database>();
  const { setNotification } = useNotification();
  const org = useOrg();
  const [viewWebhookOpen, setViewWebhookOpen] = useState(false);
  const [addWebhookOpen, setAddWebhookOpen] = useState(false);
  const [webhookError, setWebhookError] = useState<string | undefined>(
    undefined
  );
  const [showChangelogBanner, setShowChangelogBanner] = useState(true);

  const [visibleHmacKeys, setVisibleHmacKeys] = useState<
    Record<string, boolean>
  >({});

  // Check if the banner should be shown (within one week of the current date)
  useEffect(() => {
    const bannerKey = "webhooks_changelog_banner_dismissed";
    const bannerDismissed = localStorage.getItem(bannerKey);

    if (bannerDismissed) {
      setShowChangelogBanner(false);
    } else {
      // Set a timeout to auto-dismiss after one week
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      const timeUntilDismiss = oneWeekFromNow.getTime() - new Date().getTime();

      const timerId = setTimeout(() => {
        setShowChangelogBanner(false);
        localStorage.setItem(bannerKey, "true");
      }, timeUntilDismiss);

      return () => clearTimeout(timerId);
    }
  }, []);

  const dismissChangelogBanner = () => {
    setShowChangelogBanner(false);
    localStorage.setItem("webhooks_changelog_banner_dismissed", "true");
  };

  const {
    data: webhooks,
    refetch: refetchWebhooks,
    isLoading,
  } = useQuery({
    queryKey: ["webhooks", org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      return jawn.GET("/v1/webhooks");
    },
    refetchOnWindowFocus: false,
  });

  const webhookCount = webhooks?.data?.data?.length || 0;

  const { freeLimit, hasReachedLimit } = useFeatureLimit(
    "webhooks",
    webhookCount
  );

  const createWebhook = useMutation({
    mutationFn: async (data: {
      destination: string;
      config: any;
      includeData: boolean;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      try {
        const response = await jawn.POST("/v1/webhooks", {
          body: {
            destination: data.destination,
            config: data.config,
            includeData: data.includeData,
          },
        });

        // Check if response has any error indicators
        const responseAny = response as any;
        if (responseAny.error || responseAny.status >= 400) {
          const errorMessage =
            responseAny.error?.message ||
            responseAny.error ||
            "Failed to create webhook";
          throw new Error(errorMessage);
        }

        return response;
      } catch (error: any) {
        console.error("Webhook creation error:", error);
        throw new Error(error.message || "Failed to create webhook");
      }
    },
    onSuccess: () => {
      setNotification("Webhook created!", "success");
      refetchWebhooks();
      setAddWebhookOpen(false);
      setWebhookError(undefined);
    },
    onError: (error: Error) => {
      setNotification(`Error: ${error.message}`, "error");
      setWebhookError(error.message);
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.DELETE(`/v1/webhooks/{webhookId}`, {
        params: {
          path: {
            webhookId: id,
          },
        },
      });
    },
    onSuccess: () => {
      setNotification("Webhook deleted!", "success");
      refetchWebhooks();
    },
  });

  const toggleHmacVisibility = (id: string) => {
    setVisibleHmacKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification("Copied to clipboard!", "success");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      );
    }

    if (!webhooks?.data?.data || webhooks.data.data.length === 0) {
      return (
        <div className="flex flex-col w-full h-96 justify-center items-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center pt-6 space-y-4">
              <PiWebhooksLogo className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl mb-2">
                No Webhooks Created
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create a webhook to start receiving real-time updates
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Table className="w-full bg-white border rounded-md shadow-sm">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-medium">Destination</TableHead>
            <TableHead className="font-medium">Created</TableHead>
            <TableHead className="font-medium">Version</TableHead>
            <TableHead className="font-medium">Sample Rate</TableHead>
            <TableHead className="font-medium">Property Filters</TableHead>
            <TableHead className="font-medium">Include Data</TableHead>
            <TableHead className="font-medium">HMAC Key</TableHead>
            <TableHead className="font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks?.data?.data?.map((webhook) => (
            <TableRow key={webhook.id} className="hover:bg-gray-50">
              <TableCell className="max-w-[200px] truncate">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-left truncate">
                      {webhook.destination}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{webhook.destination}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>{getUSDateFromString(webhook.created_at!)}</TableCell>
              <TableCell>{webhook.version}</TableCell>
              <TableCell>
                {(webhook.config as any)?.["sampleRate"] ?? 100}%
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {
                        (
                          ((webhook.config as any)?.propertyFilters ?? []) as {
                            key: string;
                            value: string;
                          }[]
                        ).length
                      }
                    </TooltipTrigger>
                    <TooltipContent>
                      <ul className="list-disc pl-4">
                        {(
                          ((webhook.config as any)?.propertyFilters ?? []) as {
                            key: string;
                            value: string;
                          }[]
                        ).map((filter, index) => (
                          <li key={index}>
                            {filter.key}: {filter.value}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                {(webhook.config as any)?.["includeData"] !== false ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Disabled
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {visibleHmacKeys[webhook.id] ? (
                    <>
                      <span className="text-xs font-mono">
                        {webhook.hmac_key}
                      </span>
                      <button onClick={() => toggleHmacVisibility(webhook.id)}>
                        <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-mono">••••••••</span>
                      <button onClick={() => toggleHmacVisibility(webhook.id)}>
                        <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                      </button>
                    </>
                  )}
                  <button onClick={() => copyToClipboard(webhook.hmac_key)}>
                    <ClipboardIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    deleteWebhook.mutate(webhook.id);
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (!org?.currentOrg?.tier) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        <AuthHeader
          isWithinIsland={true}
          title={<div className="flex items-center gap-2 ml-8">Webhooks</div>}
        />

        {hasReachedLimit && (
          <FreeTierLimitBanner
            feature="webhooks"
            itemCount={webhookCount}
            freeLimit={freeLimit}
          />
        )}

        <div className="flex justify-between items-center mx-8 mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground transition-colors"
            asChild
          >
            <a
              href="https://docs.helicone.ai/features/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              Learn more about Helicone webhooks
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </Button>
          <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
            <DialogTrigger asChild>
              {webhookCount < freeLimit ? (
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setAddWebhookOpen(true)}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Webhook
                </Button>
              ) : (
                <FreeTierLimitWrapper
                  key={`webhook-limit-${webhookCount}`}
                  feature="webhooks"
                  itemCount={webhookCount}
                >
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Webhook
                  </Button>
                </FreeTierLimitWrapper>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <AddWebhookForm
                onSubmit={(data) => {
                  createWebhook.mutate({
                    destination: data.destination,
                    config: data.config,
                    includeData: data.includeData,
                  });
                }}
                isLoading={createWebhook.isLoading}
                error={webhookError}
                onCancel={() => setAddWebhookOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mx-8">{renderContent()}</div>
      </div>
    </>
  );
};

export default WebhooksPage;
