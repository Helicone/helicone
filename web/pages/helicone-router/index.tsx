import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H1, H2, P, Small } from "@/components/ui/typography";
import { NextPage } from "next";
import { useRouter as useNextRouter } from "next/router";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Edit,
  Plus,
  Router,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import clsx from "clsx";
import useNotification from "@/components/shared/notification/useNotification";
import { useRouter } from "@/hooks/useRouter";
import type {
  RouterConfiguration,
  RouterProviderMapping,
} from "@/hooks/useRouter";

// Loading spinner component
const LoadingSpinner = ({ size = 24 }: { size?: number }) => (
  <Loader2 className="animate-spin" size={size} />
);

const RouterPage: NextPage = () => {
  const nextRouter = useNextRouter();
  const { setNotification } = useNotification();
  const [isNewRouterOpen, setIsNewRouterOpen] = useState(false);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [currentRouter, setCurrentRouter] =
    useState<RouterConfiguration | null>(null);

  // Use our custom router hook
  const {
    routers,
    providerKeys,
    isLoading,
    routersError,
    refetchRouters,
    createRouter,
    deleteRouter,
    addProviderToRouter,
    removeProviderFromRouter,
  } = useRouter();

  // New router form state
  const [newRouterName, setNewRouterName] = useState("");
  const [newRouterDescription, setNewRouterDescription] = useState("");
  const [newRouterStrategy, setNewRouterStrategy] =
    useState<string>("weighted-random");
  const [newRouterRequestsPerMinute, setNewRouterRequestsPerMinute] =
    useState<string>("");
  const [newRouterTokensPerDay, setNewRouterTokensPerDay] =
    useState<string>("");
  const [newRouterMaxCostPerRequest, setNewRouterMaxCostPerRequest] =
    useState<string>("");
  const [newRouterMaxCostPerDay, setNewRouterMaxCostPerDay] =
    useState<string>("");
  const [newRouterCurrency, setNewRouterCurrency] = useState<string>("USD");

  // Provider dialog state
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedProviderRole, setSelectedProviderRole] =
    useState<string>("primary");
  const [selectedProviderWeight, setSelectedProviderWeight] =
    useState<string>("1.0");

  // Helper function to reset new router form
  const resetNewRouterForm = () => {
    setNewRouterName("");
    setNewRouterDescription("");
    setNewRouterStrategy("weighted-random");
    setNewRouterRequestsPerMinute("");
    setNewRouterTokensPerDay("");
    setNewRouterMaxCostPerRequest("");
    setNewRouterMaxCostPerDay("");
    setNewRouterCurrency("USD");
  };

  // Helper function to reset provider form
  const resetProviderForm = () => {
    setSelectedProviderId("");
    setSelectedProviderRole("primary");
    setSelectedProviderWeight("1.0");
  };

  // Handle creating a new router
  const handleCreateRouter = () => {
    // Properly initialize nested objects first
    const routingStrategy = newRouterStrategy as
      | "weighted-random"
      | "round-robin"
      | "fallback-only"
      | "cost-optimized";

    // Initialize the config object with properly nested structure
    const config: any = {
      routing_strategy: routingStrategy,
      limits: {
        rate: {},
        cost: {
          currency: newRouterCurrency,
        },
      },
    };

    // Add rate limit values if provided
    if (
      newRouterRequestsPerMinute &&
      newRouterRequestsPerMinute.trim() !== ""
    ) {
      config.limits.rate.requests_per_minute = parseInt(
        newRouterRequestsPerMinute
      );
    }

    if (newRouterTokensPerDay && newRouterTokensPerDay.trim() !== "") {
      config.limits.rate.tokens_per_day = parseInt(newRouterTokensPerDay);
    }

    // Add cost limit values if provided
    if (
      newRouterMaxCostPerRequest &&
      newRouterMaxCostPerRequest.trim() !== ""
    ) {
      config.limits.cost.max_cost_per_request = parseFloat(
        newRouterMaxCostPerRequest
      );
    }

    if (newRouterMaxCostPerDay && newRouterMaxCostPerDay.trim() !== "") {
      config.limits.cost.max_cost_per_day = parseFloat(newRouterMaxCostPerDay);
    }

    createRouter.mutate(
      {
        name: newRouterName,
        description: newRouterDescription || undefined,
        config,
        is_active: true,
      },
      {
        onSuccess: () => {
          resetNewRouterForm();
          setIsNewRouterOpen(false);
        },
      }
    );
  };

  // Handle adding a provider to a router
  const handleAddProvider = () => {
    if (!currentRouter) return;

    addProviderToRouter.mutate(
      {
        routerId: currentRouter.id,
        data: {
          providerKeyId: selectedProviderId,
          role: selectedProviderRole as "primary" | "fallback" | "conditional",
          weight: parseFloat(selectedProviderWeight),
        },
      },
      {
        onSuccess: () => {
          resetProviderForm();
          setIsProviderDialogOpen(false);
        },
      }
    );
  };

  // Function to open provider dialog for a specific router
  const openProviderDialog = (router: RouterConfiguration) => {
    setCurrentRouter(router);
    setIsProviderDialogOpen(true);
  };

  // Function to handle router deletion
  const handleDeleteRouter = (routerId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this router? This action cannot be undone."
      )
    ) {
      deleteRouter.mutate(routerId);
    }
  };

  // Function to handle provider removal
  const handleRemoveProvider = (routerId: string, mappingId: string) => {
    if (
      confirm("Are you sure you want to remove this provider from the router?")
    ) {
      removeProviderFromRouter.mutate({ routerId, mappingId });
    }
  };

  // Helper to format a date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get routing strategy display text
  const getRoutingStrategyText = (strategy?: string) => {
    switch (strategy) {
      case "weighted-random":
        return "Weighted Random";
      case "round-robin":
        return "Round Robin";
      case "fallback-only":
        return "Fallback Only";
      case "cost-optimized":
        return "Cost Optimized";
      default:
        return "Unknown";
    }
  };

  // Get provider role display text
  const getProviderRoleText = (role: string) => {
    switch (role) {
      case "primary":
        return "Primary";
      case "fallback":
        return "Fallback";
      case "conditional":
        return "Conditional";
      default:
        return role;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "primary":
        return "bg-primary text-primary-foreground";
      case "fallback":
        return "bg-amber-500 text-white";
      case "conditional":
        return "bg-indigo-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Debug logs - see what we're actually getting
  console.log("Routers data:", routers);
  console.log("Provider keys:", providerKeys);

  if (routersError) {
    return (
      <div className="p-8">
        <div className="flex gap-2 items-center text-destructive mb-4">
          <AlertTriangle size={20} />
          <P>Error loading router configurations</P>
        </div>
        <Button onClick={() => refetchRouters()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <H1>Router Configurations</H1>
          <P className="text-muted-foreground mt-2">
            Manage your router configurations to control how requests are
            distributed across providers.
          </P>
        </div>
        <Button
          onClick={() => setIsNewRouterOpen(true)}
          className="flex gap-2 items-center"
        >
          <Plus size={16} /> New Router
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : Array.isArray(routers) && routers.length > 0 ? (
        <div className="grid gap-6">
          {routers.map((router) => (
            <Card key={router.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Router size={18} className="text-primary" />
                      {router.name}
                      {router.is_active ? (
                        <Badge className="ml-2 bg-confirmative text-confirmative-foreground">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2">
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    {router.description && (
                      <P className="text-muted-foreground mt-1">
                        {router.description}
                      </P>
                    )}
                    <div className="flex gap-4 mt-2">
                      <Small className="text-muted-foreground">
                        Created: {formatDate(router.created_at)}
                      </Small>
                      <Small className="text-muted-foreground">
                        Strategy:{" "}
                        {getRoutingStrategyText(
                          router.config?.routing_strategy
                        )}
                      </Small>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/helicone-router/${router.id}`}
                          className="flex items-center gap-2"
                        >
                          <Edit size={14} /> Edit Router
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openProviderDialog(router)}
                        className="flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Provider
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteRouter(router.id)}
                        className="flex items-center gap-2 text-destructive"
                      >
                        <Trash2 size={14} /> Delete Router
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="providers" className="w-full">
                  <TabsList className="grid grid-cols-2 bg-muted/50 rounded-none">
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                    <TabsTrigger value="limits">Limits</TabsTrigger>
                  </TabsList>
                  <TabsContent value="providers" className="p-0">
                    {router.providers && router.providers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Provider</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {router.providers.map(
                            (mapping: RouterProviderMapping) => (
                              <TableRow key={mapping.id}>
                                <TableCell className="font-medium">
                                  {mapping.provider_key_name ||
                                    mapping.provider_key_id}
                                  {mapping.provider_name && (
                                    <Small className="block text-muted-foreground">
                                      {mapping.provider_name}
                                    </Small>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={clsx(
                                      "text-xs",
                                      getRoleBadgeColor(mapping.role)
                                    )}
                                  >
                                    {getProviderRoleText(mapping.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{mapping.weight}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveProvider(
                                        router.id,
                                        mapping.id
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={14}
                                      className="text-muted-foreground"
                                    />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-12 text-center">
                        <P className="text-muted-foreground">
                          No providers configured
                        </P>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => openProviderDialog(router)}
                        >
                          Add Provider
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="limits" className="p-6 space-y-6">
                    <div>
                      <H2 className="text-lg mb-2">Rate Limits</H2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Small className="text-muted-foreground">
                            Requests per minute
                          </Small>
                          <P className="font-semibold">
                            {router.config?.limits?.rate?.requests_per_minute ||
                              "No limit"}
                          </P>
                        </div>
                        <div>
                          <Small className="text-muted-foreground">
                            Tokens per day
                          </Small>
                          <P className="font-semibold">
                            {router.config?.limits?.rate?.tokens_per_day
                              ? new Intl.NumberFormat().format(
                                  router.config.limits.rate.tokens_per_day
                                )
                              : "No limit"}
                          </P>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <H2 className="text-lg mb-2">Cost Limits</H2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Small className="text-muted-foreground">
                            Max cost per request
                          </Small>
                          <P className="font-semibold">
                            {router.config?.limits?.cost?.max_cost_per_request
                              ? `$${router.config.limits.cost.max_cost_per_request.toFixed(
                                  5
                                )}`
                              : "No limit"}
                          </P>
                        </div>
                        <div>
                          <Small className="text-muted-foreground">
                            Max cost per day
                          </Small>
                          <P className="font-semibold">
                            {router.config?.limits?.cost?.max_cost_per_day
                              ? `$${router.config.limits.cost.max_cost_per_day.toFixed(
                                  2
                                )}`
                              : "No limit"}
                          </P>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center text-center py-16">
          <Router size={48} className="text-muted-foreground mb-4" />
          <CardTitle className="text-xl mb-2">No routers configured</CardTitle>
          <P className="text-muted-foreground max-w-md mb-6">
            Create your first router to distribute requests across multiple
            providers based on rules and limits.
          </P>
          <Button onClick={() => setIsNewRouterOpen(true)}>
            Create Router
          </Button>
        </Card>
      )}

      {/* New Router Dialog */}
      <Dialog open={isNewRouterOpen} onOpenChange={setIsNewRouterOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Router</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Router Name</Label>
              <Input
                id="name"
                placeholder="My Production Router"
                value={newRouterName}
                onChange={(e) => setNewRouterName(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Routes requests between OpenAI and Anthropic"
                value={newRouterDescription}
                onChange={(e) => setNewRouterDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="routing-strategy">Routing Strategy</Label>
              <Select
                value={newRouterStrategy}
                onValueChange={setNewRouterStrategy}
              >
                <SelectTrigger id="routing-strategy">
                  <SelectValue placeholder="Select a routing strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weighted-random">
                    Weighted Random
                  </SelectItem>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="fallback-only">Fallback Only</SelectItem>
                  <SelectItem value="cost-optimized">Cost Optimized</SelectItem>
                </SelectContent>
              </Select>
              <Small className="text-muted-foreground">
                {newRouterStrategy === "weighted-random" &&
                  "Routes requests randomly based on provider weights"}
                {newRouterStrategy === "round-robin" &&
                  "Routes requests in a rotating sequence across providers"}
                {newRouterStrategy === "fallback-only" &&
                  "Uses primary provider, with fallbacks if primary fails"}
                {newRouterStrategy === "cost-optimized" &&
                  "Routes to the most cost-effective provider based on model"}
              </Small>
            </div>
            <Separator />
            <H2 className="text-lg">Rate Limits</H2>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="requests-per-minute">Requests Per Minute</Label>
                <Input
                  id="requests-per-minute"
                  type="number"
                  placeholder="60"
                  value={newRouterRequestsPerMinute}
                  onChange={(e) =>
                    setNewRouterRequestsPerMinute(e.target.value)
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tokens-per-day">Tokens Per Day</Label>
                <Input
                  id="tokens-per-day"
                  type="number"
                  placeholder="1000000"
                  value={newRouterTokensPerDay}
                  onChange={(e) => setNewRouterTokensPerDay(e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <H2 className="text-lg">Cost Limits</H2>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="max-cost-per-request">
                  Max Cost Per Request ($)
                </Label>
                <Input
                  id="max-cost-per-request"
                  type="number"
                  step="0.0001"
                  placeholder="0.05"
                  value={newRouterMaxCostPerRequest}
                  onChange={(e) =>
                    setNewRouterMaxCostPerRequest(e.target.value)
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="max-cost-per-day">Max Cost Per Day ($)</Label>
                <Input
                  id="max-cost-per-day"
                  type="number"
                  placeholder="10.00"
                  value={newRouterMaxCostPerDay}
                  onChange={(e) => setNewRouterMaxCostPerDay(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRouterOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRouter}
              disabled={!newRouterName || createRouter.isLoading}
              className="flex gap-2"
            >
              {createRouter.isLoading ? (
                <LoadingSpinner size={16} />
              ) : (
                <Plus size={16} />
              )}
              Create Router
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Provider Dialog */}
      <Dialog
        open={isProviderDialogOpen}
        onOpenChange={setIsProviderDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Provider to Router</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={selectedProviderId}
                onValueChange={setSelectedProviderId}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(providerKeys) ? (
                    providerKeys.map((key: any) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.provider_key_name} ({key.provider_name})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading provider keys...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedProviderRole}
                onValueChange={setSelectedProviderRole}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="fallback">Fallback</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                </SelectContent>
              </Select>
              <Small className="text-muted-foreground">
                {selectedProviderRole === "primary" &&
                  "Used as the main provider for requests"}
                {selectedProviderRole === "fallback" &&
                  "Used when primary providers fail"}
                {selectedProviderRole === "conditional" &&
                  "Used only when specific conditions are met"}
              </Small>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                max="1"
                placeholder="1.0"
                value={selectedProviderWeight}
                onChange={(e) => setSelectedProviderWeight(e.target.value)}
              />
              <Small className="text-muted-foreground">
                Relative routing weight (0-1). Higher values receive more
                traffic.
              </Small>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProviderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProvider}
              disabled={!selectedProviderId || addProviderToRouter.isLoading}
              className="flex gap-2"
            >
              {addProviderToRouter.isLoading ? (
                <LoadingSpinner size={16} />
              ) : (
                <Check size={16} />
              )}
              Add Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RouterPage;
