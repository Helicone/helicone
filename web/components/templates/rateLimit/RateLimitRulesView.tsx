import { P } from "@/components/ui/typography";
import { Col } from "../../layout/common/col";
import { useState } from "react";
import CreateRateLimitRuleModal from "./CreateRateLimitRuleModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/org/organizationContext";
import { $JAWN_API } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/private";
import useNotification from "@/components/shared/notification/useNotification";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PiPlusBold } from "react-icons/pi";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LoadingAnimation from "@/components/shared/loadingAnimation";

type RateLimitRuleView = components["schemas"]["RateLimitRuleView"];

const RateLimitRulesView = () => {
  const org = useOrg();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["rateLimits", org?.currentOrg?.id],
    queryFn: async () => {
      if (!org?.currentOrg?.id) {
        return null; // Or throw an error, depending on desired behavior
      }
      const response = await $JAWN_API.GET("/v1/rate-limits");
      return response;
    },
    enabled: !!org?.currentOrg?.id,
  });

  // --- Delete Mutation (defined before handleDelete) ---
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const resp = await $JAWN_API.DELETE("/v1/rate-limits/{ruleId}", {
        params: {
          path: { ruleId },
        },
      });
      if (resp.data?.error) {
        throw new Error(resp.data.error);
      }
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rateLimits", org?.currentOrg?.id],
      });
    },
    // onError handled by try/catch in handleDelete
  });

  // Extract rules list and potential API error from the response data
  const rules = data?.data?.data;
  const apiError = data?.data?.error;
  const networkError = error;

  const handleCreateSuccess = (newRule: RateLimitRuleView) => {
    setNotification("Rate limit rule created successfully!", "success");
  };

  // --- Delete Handler ---
  const handleDelete = async (ruleId: string, ruleName: string) => {
    // Confirmation is now handled by AlertDialog
    try {
      await deleteRuleMutation.mutateAsync(ruleId);
      setNotification(
        `Successfully deleted rate limit rule "${ruleName}"`,
        "success"
      );
    } catch (error) {
      // Log the actual error object for debugging
      console.error("Failed to delete rate limit rule:", error);
      setNotification(
        `Failed to delete rule: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }
  };

  return (
    <Col>
      <div className="flex flex-col gap-6">
        {/* Loading State - Reverted to using P tag */}
        {isLoading && <LoadingAnimation />}

        {/* Error State (Network or API) */}
        {(isError || apiError) && (
          <div className="flex flex-col items-center justify-center gap-4 bg-destructive/10 text-destructive">
            <P className="text-center font-semibold">Error fetching rules</P>
            <P className="text-center text-xs">
              {networkError?.message ||
                apiError ||
                "An unknown error occurred."}
            </P>
          </div>
        )}

        {/* No Rules State */}
        {!isLoading &&
          !isError &&
          !apiError &&
          (!rules || rules.length === 0) && (
            <div className="p-6 flex flex-col items-center justify-center gap-4 bg-muted dark:bg-muted/50">
              <P className="text-center text-muted-foreground">
                No rate limits defined yet. Create your first rate limit rule to
                get started.
              </P>
            </div>
          )}

        {/* Display Rules Table */}
        {!isLoading && !isError && !apiError && rules && rules.length > 0 && (
          <div className="bg-card  shadow-sm overflow-hidden dark:border-slate-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b border-border dark:border-slate-800">
                    <TableHead className="font-semibold text-sm py-2.5 px-4 border-r border-border">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-sm py-2.5 px-4 border-r border-border">
                      Quota
                    </TableHead>
                    <TableHead className="font-semibold text-sm py-2.5 px-4 border-r border-border">
                      Unit
                    </TableHead>
                    <TableHead className="font-semibold text-sm py-2.5 px-4 border-r border-border">
                      Window (sec)
                    </TableHead>
                    <TableHead className="font-semibold text-sm py-2.5 px-4 border-r border-border">
                      Applies To
                    </TableHead>
                    <TableHead className="font-semibold text-sm py-2.5 px-4 border-r border-border">
                      Created
                    </TableHead>
                    <TableHead className="font-semibold text-sm py-2.5 px-4 last:border-r-0">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => {
                    let appliesToElement: React.ReactNode = (
                      <Badge variant="secondary">Global</Badge> // Use secondary for Global
                    );
                    if (rule.segment === "user") {
                      appliesToElement = <Badge variant="default">User</Badge>; // Use default for User
                    } else if (rule.segment) {
                      appliesToElement = (
                        // Use outline for Property, maybe add specific styling later
                        <Badge variant="outline">{`Property: ${rule.segment}`}</Badge>
                      );
                    }

                    let unitElement: React.ReactNode = (
                      <Badge variant="outline">
                        {rule.unit === "requests"
                          ? "Requests"
                          : rule.unit === "cents"
                          ? "Cents"
                          : rule.unit}
                      </Badge>
                    );

                    return (
                      <TableRow
                        key={rule.id}
                        // Added hover, transition, border, cursor (optional for now)
                        className="hover:bg-muted/25 transition-colors border-b border-border/40 dark:border-slate-800/40 last:border-0"
                        // onClick={() => router.push(`/rate-limits/${rule.id}`)} // Example navigation
                      >
                        <TableCell className="font-medium py-3 px-4">
                          {rule.name}
                        </TableCell>
                        {/* Quota: left (default) */}
                        <TableCell className="py-3 px-4">
                          {rule.quota.toLocaleString()}
                        </TableCell>
                        {/* Unit: left (default) */}
                        <TableCell className="py-3 px-4">
                          {unitElement}
                        </TableCell>
                        {/* Window: left (default) */}
                        <TableCell className="py-3 px-4">
                          {rule.window_seconds.toLocaleString()}
                        </TableCell>
                        {/* Applies To: left (default) */}
                        <TableCell className="py-3 px-4">
                          {appliesToElement}
                        </TableCell>
                        {/* Created: left (default) */}
                        <TableCell className="text-muted-foreground text-sm py-3 px-4">
                          {new Date(rule.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        {/* Actions: left (default) */}
                        <TableCell className="py-3 px-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  // Trigger now just needs stopPropagation
                                  e.stopPropagation();
                                }}
                                disabled={deleteRuleMutation.isPending}
                              >
                                <Trash2
                                  size={15}
                                  className="text-destructive"
                                />
                              </Button>
                            </AlertDialogTrigger>
                            {/* Content is specific to this row's rule */}
                            <AlertDialogContent
                              onClick={(e) => e.stopPropagation()}
                            >
                              {" "}
                              {/* Prevent row click when dialog open */}
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure you want to delete this rate
                                  limit rule?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the rate limit rule
                                  <strong>{` "${rule.name}"`}</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(rule.id, rule.name);
                                  }}
                                  disabled={deleteRuleMutation.isPending}
                                >
                                  {deleteRuleMutation.isPending
                                    ? "Deleting..."
                                    : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <div className="flex justify-end items-right pr-4">
          <Button
            key="create-rate-limit-rule"
            onClick={() => setIsCreateModalOpen(true)}
            variant="action"
            size="sm"
            className="gap-1 items-center"
          >
            <PiPlusBold className="h-3.5 w-3.5" />
            Create Rule
          </Button>
        </div>
      </div>

      <CreateRateLimitRuleModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </Col>
  );
};

export default RateLimitRulesView;
