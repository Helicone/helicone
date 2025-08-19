import {
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import { logger } from "@/lib/telemetry/logger";
import { getUSDateFromString } from "../../shared/utils/utils";
import AddWebhookForm from "./addWebhookForm";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";

// Import ShadcnUI components
import AuthHeader from "@/components/shared/authHeader";
import { Button } from "@/components/ui/button";
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

interface WebhooksPageProps {}

const WebhooksPage = (props: WebhooksPageProps) => {
  const { setNotification } = useNotification();
  const org = useOrg();
  const [addWebhookOpen, setAddWebhookOpen] = useState(false);
  const [webhookError, setWebhookError] = useState<string | undefined>(
    undefined,
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

  const { freeLimit, canCreate } = useFeatureLimit("webhooks", webhookCount);

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
        logger.error({ error }, "Webhook creation error");
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

  const handleAddWebhook = () => {
    setAddWebhookOpen(true);
  };

  const toggleHmacVisibility = (id: string) => {
    setVisibleHmacKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification("Copied to clipboard!", "success");
  };

  if (!org?.currentOrg?.tier) {
    return null;
  }

  if (!isLoading && webhookCount === 0) {
    return (
      <div className="flex h-screen w-full flex-col bg-background dark:bg-sidebar-background">
        <div className="flex h-full flex-1">
          <EmptyStateCard
            feature="webhooks"
            onPrimaryClick={handleAddWebhook}
          />
        </div>
        <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
          <DialogContent className="max-w-2xl">
            <AddWebhookForm
              onSubmit={(data) => {
                createWebhook.mutate({
                  destination: data.destination,
                  config: data.config,
                  includeData: data.includeData,
                });
              }}
              isLoading={createWebhook.isPending}
              error={webhookError}
              onCancel={() => setAddWebhookOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        <AuthHeader
          isWithinIsland={true}
          title={<div className="ml-8 flex items-center gap-2">Webhooks</div>}
        />

        {!canCreate && (
          <FreeTierLimitBanner
            feature="webhooks"
            itemCount={webhookCount}
            freeLimit={freeLimit}
          />
        )}

        <div className="mx-8 mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground transition-colors hover:text-foreground"
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
                  onClick={handleAddWebhook}
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
                isLoading={createWebhook.isPending}
                error={webhookError}
                onCancel={() => setAddWebhookOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mx-8">
          <Table className="w-full rounded-md border border-border bg-background shadow-sm">
            <TableHeader className="bg-card">
              <TableRow>
                <TableHead className="text-xs font-medium">
                  Destination
                </TableHead>
                <TableHead className="text-xs font-medium">Created</TableHead>
                <TableHead className="text-xs font-medium">Version</TableHead>
                <TableHead className="text-xs font-medium">
                  Sample Rate
                </TableHead>
                <TableHead className="text-xs font-medium">
                  Property Filters
                </TableHead>
                <TableHead className="text-xs font-medium">
                  Include Data
                </TableHead>
                <TableHead className="text-xs font-medium">HMAC Key</TableHead>
                <TableHead className="text-xs font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks?.data?.data?.map((webhook) => (
                <TableRow key={webhook.id} className="hover:bg-muted">
                  <TableCell className="max-w-[200px] truncate">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="truncate text-left">
                          {webhook.destination}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{webhook.destination}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {getUSDateFromString(webhook.created_at!)}
                  </TableCell>
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
                              ((webhook.config as any)?.propertyFilters ??
                                []) as {
                                key: string;
                                value: string;
                              }[]
                            ).length
                          }
                        </TooltipTrigger>
                        <TooltipContent>
                          <ul className="list-disc pl-4">
                            {(
                              ((webhook.config as any)?.propertyFilters ??
                                []) as {
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
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Disabled
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {visibleHmacKeys[webhook.id] ? (
                        <>
                          <span className="font-mono text-xs">
                            {webhook.hmac_key}
                          </span>
                          <button
                            onClick={() => toggleHmacVisibility(webhook.id)}
                          >
                            <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-mono">••••••••</span>
                          <button
                            onClick={() => toggleHmacVisibility(webhook.id)}
                          >
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
                      className="ml-2 text-white"
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
        </div>
      </div>
    </>
  );
};

export default WebhooksPage;
