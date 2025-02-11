import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import {
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import { getUSDateFromString } from "../../shared/utils/utils";
import AddWebhookForm from "./addWebhookForm";

// Import ShadcnUI components
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
import { getJawnClient } from "@/lib/clients/jawn";
import AuthHeader from "@/components/shared/authHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PiWebhooksLogo } from "react-icons/pi";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ExternalLinkIcon } from "lucide-react";

interface WebhooksPageProps {
  user: User;
}

const WebhooksPage = (props: WebhooksPageProps) => {
  const client = useSupabaseClient<Database>();
  const { setNotification } = useNotification();
  const org = useOrg();
  const [viewWebhookOpen, setViewWebhookOpen] = useState(false);
  const [addWebhookOpen, setAddWebhookOpen] = useState(false);

  const [visibleHmacKeys, setVisibleHmacKeys] = useState<
    Record<string, boolean>
  >({});

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

  const createWebhook = useMutation({
    mutationFn: async (data: { destination: string; config: any }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.POST("/v1/webhooks", {
        body: {
          destination: data.destination,
          config: data.config,
        },
      });
    },
    onSuccess: () => {
      setNotification("Webhook created!", "success");
      refetchWebhooks();
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
              <p className="text-sm text-muted-foreground text-center">
                Create a webhook to start receiving real-time updates
              </p>
              <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="max-w-fit ml-2"
                  >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl w-full">
                  <AddWebhookForm
                    onSubmit={(data) => {
                      createWebhook.mutate({
                        destination: data.destination,
                        config: data.config,
                      });
                      setAddWebhookOpen(false);
                    }}
                    isLoading={createWebhook.isLoading}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Table className="w-full bg-white border">
        <TableHeader>
          <TableRow>
            <TableHead>Destination</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Sample Rate</TableHead>
            <TableHead>Property Filters</TableHead>
            <TableHead>HMAC Key</TableHead>

            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks?.data?.data?.map((webhook) => (
            <TableRow key={webhook.id}>
              <TableCell>{webhook.destination}</TableCell>

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
                <div className="flex items-center space-x-2">
                  {visibleHmacKeys[webhook.id] ? (
                    <>
                      <span>{webhook.hmac_key}</span>
                      <button onClick={() => toggleHmacVisibility(webhook.id)}>
                        <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span>••••••••</span>
                      <button onClick={() => toggleHmacVisibility(webhook.id)}>
                        <EyeIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </>
                  )}
                  <button onClick={() => copyToClipboard(webhook.hmac_key)}>
                    <ClipboardIcon className="h-5 w-5 text-gray-500" />
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

  const isWebhooksEnabled = () => {
    return (
      org?.currentOrg?.tier === "enterprise" ||
      org?.currentOrg?.tier === "pro-20240913" ||
      org?.currentOrg?.tier === "pro-20250202" ||
      org?.currentOrg?.tier === "demo"
    );
  };

  if (!isWebhooksEnabled()) {
    return (
      <div className="flex justify-center items-center bg-white">
        <FeatureUpgradeCard
          title="Webhooks"
          headerTagline="Subscribe to API requests with webhooks"
          icon={<PiWebhooksLogo className="h-4 w-4 text-sky-500" />}
          highlightedFeature="webhooks"
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-2">
        <AuthHeader
          isWithinIsland={true}
          title={<div className="flex items-center gap-2 ml-8">Webhooks</div>}
        />

        <div className="ml-8 mb-4">
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
        </div>

        {renderContent()}

        <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-fit ml-2">
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-full">
            <AddWebhookForm
              onSubmit={(data) => {
                createWebhook.mutate({
                  destination: data.destination,
                  config: data.config,
                });
                setAddWebhookOpen(false);
              }}
              isLoading={createWebhook.isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default WebhooksPage;
