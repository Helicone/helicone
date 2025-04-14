import React, { useState, useEffect } from "react";
import { useEvaluators } from "./EvaluatorHook";
import AuthHeader from "@/components/shared/authHeader";
import { Button } from "@/components/ui/button";
import { PiPlusBold } from "react-icons/pi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { H2 } from "@/components/ui/typography";
import Link from "next/link";
import { LineChart, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericEmptyState from "@/components/shared/helicone/GenericEmptyState";
import useNotification from "@/components/shared/notification/useNotification";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function EvaluatorsList() {
  const { evaluators, deleteEvaluator } = useEvaluators();
  const notification = useNotification();
  const org = useOrg();
  const router = useRouter();

  // State to store online evaluator counts
  const [onlineEvaluatorCounts, setOnlineEvaluatorCounts] = useState<
    Map<string, number>
  >(new Map());
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // Whenever the evaluators list changes, update the online counts
  useEffect(() => {
    if (evaluators.data?.data?.data) {
      const evaluatorsList = evaluators.data.data.data;

      // Create a function to fetch online evaluator counts for each evaluator
      const fetchOnlineCounts = async () => {
        setIsLoadingCounts(true);
        const counts = new Map<string, number>();

        // Pre-initialize all evaluators with 0 counts
        evaluatorsList.forEach((evaluator) => {
          counts.set(evaluator.id, 0);
        });

        // Fetch counts for each evaluator
        const jawn = getJawnClient(org?.currentOrg?.id!);

        // Process evaluators in batches to avoid too many concurrent requests
        const batchSize = 5;
        for (let i = 0; i < evaluatorsList.length; i += batchSize) {
          const batch = evaluatorsList.slice(i, i + batchSize);

          // Create and execute promises for this batch
          const promises = batch.map(async (evaluator) => {
            try {
              const response = await jawn.GET(
                "/v1/evaluator/{evaluatorId}/onlineEvaluators",
                {
                  params: {
                    path: {
                      evaluatorId: evaluator.id,
                    },
                  },
                }
              );

              // Safely check for data with proper type checking
              if (
                response &&
                typeof response === "object" &&
                "data" in response &&
                response.data &&
                typeof response.data === "object" &&
                "data" in response.data &&
                Array.isArray(response.data.data)
              ) {
                counts.set(evaluator.id, response.data.data.length);
              }
            } catch (error) {
              console.error(
                `Error fetching online evaluators for ${evaluator.id}:`,
                error
              );
            }
          });

          // Wait for this batch to complete before moving to the next
          await Promise.all(promises);
        }

        setOnlineEvaluatorCounts(counts);
        setIsLoadingCounts(false);
      };

      fetchOnlineCounts();
    }
  }, [evaluators.data, org?.currentOrg?.id]);

  // Helper to format date strings
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle delete with confirmation
  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(`Are you sure you want to delete evaluator "${name}"?`)
    ) {
      try {
        await deleteEvaluator.mutateAsync(id);
        notification.setNotification(
          `Successfully deleted "${name}"`,
          "success"
        );
      } catch (error) {
        notification.setNotification("Failed to delete evaluator", "error");
      }
    }
  };

  // Loading state
  if (evaluators.isLoading) {
    return (
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <H2>Evaluators</H2>
        </div>
        <Card className="w-full p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  // Get data from API response
  const evaluatorsList = evaluators.data?.data?.data || [];

  // Empty state
  if (evaluatorsList.length === 0) {
    return (
      <div>
        <AuthHeader
          title="Evaluators"
          actions={[
            <Link href="/evaluators/new" key="create-evaluator">
              <Button variant="action" size="sm" className="gap-1 items-center">
                <PiPlusBold className="h-3.5 w-3.5" />
                Create Evaluator
              </Button>
            </Link>,
          ]}
        />
        <div className="p-6">
          <GenericEmptyState
            title="Create Your First Evaluator"
            description="Create an evaluator to score your LLM outputs and measure their quality."
            icon={<LineChart size={28} className="text-accent-foreground" />}
            className="w-full"
            actions={
              <Link href="/evaluators/new">
                <Button variant="default">
                  Create Evaluator
                  <PiPlusBold className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Evaluators"
        actions={[
          <Link href="/evaluators/new" key="create-evaluator">
            <Button variant="action" size="sm" className="gap-1 items-center">
              <PiPlusBold className="h-3.5 w-3.5" />
              Create Evaluator
            </Button>
          </Link>,
        ]}
      />
      <div className="p-6">
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden dark:border-slate-800">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b border-border dark:border-slate-800">
                  <TableHead className="font-semibold text-sm py-2.5 px-4">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-sm py-2.5 px-4">
                    Type
                  </TableHead>
                  <TableHead className="font-semibold text-sm py-2.5 px-4">
                    Scoring
                  </TableHead>
                  <TableHead className="font-semibold text-sm w-28 py-2.5 px-4">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-sm py-2.5 px-4">
                    Created
                  </TableHead>
                  <TableHead className="font-semibold text-sm text-right py-2.5 px-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluatorsList.map((evaluator) => {
                  // Determine evaluator type
                  let type = "Default";
                  if (evaluator.llm_template) {
                    type = "LLM";
                  } else if (evaluator.code_template) {
                    type = "Python";
                  } else if (evaluator.last_mile_config) {
                    type = "LastMile";
                  }

                  // Get online evaluator count
                  const onlineCount =
                    onlineEvaluatorCounts.get(evaluator.id) || 0;

                  return (
                    <TableRow
                      key={evaluator.id}
                      className="hover:bg-muted/25 transition-colors border-b border-border/40 dark:border-slate-800/40 last:border-0 cursor-pointer"
                      onClick={() => router.push(`/evaluators/${evaluator.id}`)}
                    >
                      <TableCell className="font-medium py-3 px-4">
                        {evaluator.name}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "inline-flex items-center h-6 px-3 py-1 text-xs whitespace-nowrap",
                            type === "LLM"
                              ? "bg-blue-50/50 text-blue-600 border-blue-100"
                              : type === "Python"
                              ? "bg-purple-50/50 text-purple-600 border-purple-100"
                              : type === "LastMile"
                              ? "bg-amber-50/50 text-amber-600 border-amber-100"
                              : "bg-slate-50/50 text-slate-600 border-slate-100",
                            "dark:bg-transparent dark:border-opacity-20 dark:text-opacity-80"
                          )}
                        >
                          {type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "inline-flex items-center h-6 px-3 py-1 text-xs whitespace-nowrap truncate max-w-[120px]",
                            (
                              evaluator.scoring_type?.toLowerCase() || ""
                            ).includes("boolean")
                              ? "bg-cyan-50/50 text-cyan-600 border-cyan-100"
                              : (
                                  evaluator.scoring_type?.toLowerCase() || ""
                                ).includes("choice")
                              ? "bg-violet-50/50 text-violet-600 border-violet-100"
                              : (
                                  evaluator.scoring_type?.toLowerCase() || ""
                                ).includes("range")
                              ? "bg-rose-50/50 text-rose-600 border-rose-100"
                              : "bg-slate-50/50 text-slate-600 border-slate-100",
                            "dark:bg-transparent dark:border-opacity-20 dark:text-opacity-80"
                          )}
                        >
                          {evaluator.scoring_type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        {isLoadingCounts ? (
                          <div className="animate-pulse h-4 bg-muted rounded w-8"></div>
                        ) : onlineCount > 0 ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "bg-green-50/50 text-green-600 border-green-100",
                              "dark:bg-transparent dark:border-green-800/20 dark:text-green-400",
                              "inline-flex items-center h-6 gap-1.5 px-3 py-1 text-xs whitespace-nowrap"
                            )}
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            {onlineCount} online
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "bg-muted/10 border-muted/50 text-muted-foreground",
                              "inline-flex items-center h-6 px-3 py-1 text-xs whitespace-nowrap"
                            )}
                          >
                            Offline
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground text-sm">
                        {evaluator.created_at
                          ? formatDate(evaluator.created_at)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right py-3 px-4">
                        <div className="flex justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              handleDelete(evaluator.id, evaluator.name);
                            }}
                          >
                            <Trash2 size={15} className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
