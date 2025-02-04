import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Edit2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminOnPremPageProps {}

const providers = [
  { name: "OPENAI", placeholder: "Enter OpenAI key" },
  { name: "ANTHROPIC", placeholder: "Enter Anthropic key" },
  { name: "TOGETHER_AI", placeholder: "Enter Together AI key" },
  { name: "GOOGLE_VERTEX", placeholder: "Enter Google Vertex AI key" },
  { name: "MISTRAL", placeholder: "Enter Mistral AI key" },
  { name: "AZURE_OPENAI", placeholder: "Enter Azure OpenAI key" },
];

export interface AzureExperiment {
  azureBaseUri: string;
  azureApiVersion: string;
  azureDeploymentName: string;
  azureApiKey: string;
}

const useGovernanceOrgs = () => {
  const org = useOrg();
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();
  const governanceOrgsQuery = useQuery({
    queryKey: ["governance-orgs", org?.currentOrg?.id],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/admin/governance-orgs");
    },
    onError: () => {
      setNotification("Failed to fetch governance organizations", "error");
    },
  });

  const deleteGovernanceOrg = useMutation({
    mutationFn: (orgId: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.DELETE("/v1/admin/governance-orgs/{orgId}", {
        params: {
          path: {
            orgId,
          },
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["governance-orgs", org?.currentOrg?.id],
      });
      setNotification("Organization removed", "success");
    },
    onError: () => {
      setNotification("Failed to remove organization", "error");
    },
  });

  const addGovernanceOrg = useMutation({
    mutationFn: async ({
      orgId,
      limitUSD,
      days,
    }: {
      orgId: string;
      limitUSD: number | null;
      days: number | null;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const response = await jawn.POST("/v1/admin/governance-orgs/{orgId}", {
        params: {
          path: {
            orgId,
          },
        },
        body: {
          limitUSD,
          days: days,
        },
      });
      if (response.response.ok) {
        setNotification("Organization added", "success");
      } else {
        setNotification("Failed to add organization", "error");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["governance-orgs", org?.currentOrg?.id],
      });
    },
  });

  const updateGovernanceOrg = useMutation({
    mutationFn: async ({
      orgId,
      limitUSD,
      days,
    }: {
      orgId: string;
      limitUSD: number;
      days: number;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.POST("/v1/admin/governance-orgs/{orgId}", {
        params: { path: { orgId } },
        body: { limitUSD, days },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["governance-orgs", org?.currentOrg?.id],
      });
      setNotification("Organization updated", "success");
    },
    onError: () => {
      setNotification("Failed to update organization", "error");
    },
  });

  return {
    governanceOrgsQuery,
    deleteGovernanceOrg,
    addGovernanceOrg,
    updateGovernanceOrg,
  };
};

const useGovernanceKeys = () => {
  const org = useOrg();
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();
  const governanceKeysQuery = useQuery({
    queryKey: ["governance-keys", org?.currentOrg?.id],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/admin/governance-orgs/keys");
    },
    onError: () => {
      setNotification("Failed to fetch keys", "error");
    },
  });

  const deleteGovernanceKey = useMutation({
    mutationFn: (name: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.DELETE("/v1/admin/governance-orgs/keys", {
        body: { name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["governance-keys", org?.currentOrg?.id],
      });
      setNotification("Key deleted", "success");
    },
    onError: () => {
      setNotification("Failed to delete key", "error");
    },
  });
  const addGovernanceKey = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.POST("/v1/admin/governance-orgs/keys", {
        body: { name, value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["governance-keys", org?.currentOrg?.id],
      });
      setNotification("Key saved", "success");
    },
    onError: () => {
      setNotification("Failed to add key", "error");
    },
  });

  return {
    governanceKeysQuery,
    deleteGovernanceKey,
    addGovernanceKey,
  };
};

export const AdminGovernanceOrgsPage = (props: AdminOnPremPageProps) => {
  const {
    governanceOrgsQuery,
    deleteGovernanceOrg,
    addGovernanceOrg,
    updateGovernanceOrg,
  } = useGovernanceOrgs();
  const [newOrgId, setNewOrgId] = useState("");
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<string>("");
  const [newLimit, setNewLimit] = useState<string>("1000");
  const [newDays, setNewDays] = useState<string>("10");

  const [editingDays, setEditingDays] = useState<string>("");
  const { governanceKeysQuery, deleteGovernanceKey, addGovernanceKey } =
    useGovernanceKeys();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgId) return;

    try {
      await addGovernanceOrg.mutateAsync({
        orgId: newOrgId,
        limitUSD: parseFloat(newLimit),
        days: parseInt(newDays),
      });
      setNewOrgId("");
      setNewLimit("1000");
      setNewDays("10");
    } catch (error) {}
  };

  const handleUpdateLimit = async (orgId: string) => {
    const limitUSD = parseFloat(editingLimit);
    const days = parseInt(editingDays);
    if (isNaN(limitUSD) || isNaN(days)) return;

    try {
      await updateGovernanceOrg.mutateAsync({ orgId, limitUSD, days });
      setEditingOrg(null);
      setEditingLimit("");
      setEditingDays("");
    } catch (error) {}
  };

  const [apiKeys, setApiKeys] = useState<{ name: string; value: string }[]>([]);

  useEffect(() => {
    setApiKeys(
      (governanceKeysQuery.data?.data?.data?.settings?.keys as any) || []
    );
  }, [governanceKeysQuery.data]);

  return (
    <div className="flex flex-col space-y-4 p-6">
      <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Governance Settings
      </h1>

      <Tabs defaultValue="orgs" className="w-full">
        <TabsList>
          <TabsTrigger value="orgs">Organizations</TabsTrigger>
          <TabsTrigger value="keys">Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="orgs" className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">About Rate Limits</p>
            <p>
              The limits set here create a rolling window rate limit for the
              entire organization. All API usage from Access Keys belonging to
              members of this organization will count towards this collective
              limit. Once the spending limit is reached within the specified
              number of days, all API requests will be blocked until the window
              resets.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground">
                Add a new governance organization
              </p>
              <Input
                placeholder="Enter Organization ID make a governance org"
                value={newOrgId}
                onChange={(e) => setNewOrgId(e.target.value)}
                className="max-w-sm text-black"
              />
              {newOrgId && (
                <>
                  <Label>Configure Limits</Label>

                  <div className="flex space-x-4">
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="limitUSD" className="text-sm font-medium">
                        Limit (USD)
                      </label>
                      <Input
                        id="limitUSD"
                        type="number"
                        placeholder="1000"
                        value={newLimit}
                        onChange={(e) => setNewLimit(e.target.value)}
                        className="max-w-[150px] text-black"
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label htmlFor="days" className="text-sm font-medium">
                        Days
                      </label>
                      <Input
                        id="days"
                        type="number"
                        placeholder="10"
                        value={newDays}
                        onChange={(e) => setNewDays(e.target.value)}
                        className="max-w-[150px] text-black"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={addGovernanceOrg.isLoading}
                    variant="default"
                    className="max-w-sm"
                  >
                    {addGovernanceOrg.isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add
                  </Button>
                </>
              )}
            </div>
          </form>

          <div className="flex flex-col space-y-2">
            {governanceOrgsQuery.isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : governanceOrgsQuery.data?.data?.data?.length ? (
              governanceOrgsQuery.data.data.data.map((org) => (
                <Card key={org.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{org.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {org.governance_settings?.limitUSD === null &&
                        org.governance_settings?.days === null
                          ? "Unlimited"
                          : `Limit: $${
                              org.governance_settings?.limitUSD || 0
                            } / ${org.governance_settings?.days || 0} days`}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {org.id}
                    </span>
                    <div className="flex items-center gap-2">
                      {editingOrg === org.id ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <label className="text-xs text-muted-foreground">
                                Limit (USD)
                              </label>
                              <Input
                                type="number"
                                value={editingLimit}
                                onChange={(e) =>
                                  setEditingLimit(e.target.value)
                                }
                                className="w-24"
                              />
                            </div>
                            <div className="flex flex-col">
                              <label className="text-xs text-muted-foreground">
                                Days
                              </label>
                              <Input
                                type="number"
                                value={editingDays}
                                onChange={(e) => setEditingDays(e.target.value)}
                                className="w-24"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUpdateLimit(org.id)}
                              disabled={updateGovernanceOrg.isLoading}
                            >
                              {updateGovernanceOrg.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteGovernanceOrg.mutate(org.id)}
                            disabled={deleteGovernanceOrg.isLoading}
                          >
                            {deleteGovernanceOrg.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingOrg(org.id);
                              setEditingLimit(
                                org.governance_settings?.limitUSD?.toString() ||
                                  "0"
                              );
                              setEditingDays(
                                org.governance_settings?.days?.toString() ||
                                  "10"
                              );
                            }}
                            disabled={updateGovernanceOrg.isLoading}
                          >
                            {updateGovernanceOrg.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No governance organizations added yet
                </CardContent>
              </Card>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Set to 0 for unlimited usage
          </p>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">About Keys</p>
            <p>Manage API keys and their settings here.</p>
          </div>
          {/* Add your keys management content here */}

          {providers.map((provider) => (
            <div key={provider.name} className="space-y-2">
              <Label>{provider.name}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={provider.placeholder}
                  className="text-black flex-1"
                  type="password"
                  value={
                    apiKeys.find((key) => key.name === provider.name)?.value ||
                    ""
                  }
                  onChange={(e) =>
                    setApiKeys(
                      apiKeys
                        .map((key) =>
                          key.name === provider.name
                            ? { ...key, value: e.target.value }
                            : key
                        )
                        .concat(
                          apiKeys.find((k) => k.name === provider.name)
                            ? []
                            : [{ name: provider.name, value: e.target.value }]
                        )
                    )
                  }
                />
                <Button
                  onClick={() =>
                    addGovernanceKey.mutate({
                      name: provider.name,
                      value:
                        apiKeys.find((key) => key.name === provider.name)
                          ?.value || "",
                    })
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
