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
import { logger } from "@/lib/telemetry/logger";
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
                },
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
              logger.error(
                {
                  error: error,
                  evaluatorId: evaluator.id,
                },
                `Error fetching online evaluators for ${evaluator.id}:`,
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
          "success",
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
        <div className="mb-6 flex items-center justify-between">
          <H2>Evaluators</H2>
        </div>
        <Card className="w-full p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-muted"></div>
            <div className="h-4 w-1/2 rounded bg-muted"></div>
            <div className="h-4 w-5/6 rounded bg-muted"></div>
            <div className="h-4 w-2/3 rounded bg-muted"></div>
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
      <>
        <div>
          <AuthHeader
            title="Evaluators"
            actions={[
              <Link href="/evaluators/new" key="create-evaluator">
                <Button
                  variant="action"
                  size="sm"
                  className="items-center gap-1"
                >
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
                    <PiPlusBold className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Evaluators"
        actions={[
          <Link href="/evaluators/new" key="create-evaluator">
            <Button variant="action" size="sm" className="items-center gap-1">
              <PiPlusBold className="h-3.5 w-3.5" />
              Create Evaluator
            </Button>
          </Link>,
        ]}
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:border-slate-800">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border hover:bg-transparent dark:border-slate-800">
                  <TableHead className="px-4 py-2.5 text-sm font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-sm font-semibold">
                    Type
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-sm font-semibold">
                    Scoring
                  </TableHead>
                  <TableHead className="w-28 px-4 py-2.5 text-sm font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-sm font-semibold">
                    Created
                  </TableHead>
                  <TableHead className="px-4 py-2.5 text-right text-sm font-semibold">
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
                      className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-muted/25 dark:border-slate-800/40"
                      onClick={() => router.push(`/evaluators/${evaluator.id}`)}
                    >
                      <TableCell className="px-4 py-3 font-medium">
                        {evaluator.name}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "inline-flex h-6 items-center whitespace-nowrap px-3 py-1 text-xs",
                            type === "LLM"
                              ? "border-blue-100 bg-blue-50/50 text-blue-600"
                              : type === "Python"
                                ? "border-purple-100 bg-purple-50/50 text-purple-600"
                                : type === "LastMile"
                                  ? "border-amber-100 bg-amber-50/50 text-amber-600"
                                  : "border-slate-100 bg-slate-50/50 text-slate-600",
                            "dark:border-opacity-20 dark:bg-transparent dark:text-opacity-80",
                          )}
                        >
                          {type}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "inline-flex h-6 max-w-[120px] items-center truncate whitespace-nowrap px-3 py-1 text-xs",
                            (
                              evaluator.scoring_type?.toLowerCase() || ""
                            ).includes("boolean")
                              ? "border-cyan-100 bg-cyan-50/50 text-cyan-600"
                              : (
                                    evaluator.scoring_type?.toLowerCase() || ""
                                  ).includes("choice")
                                ? "border-violet-100 bg-violet-50/50 text-violet-600"
                                : (
                                      evaluator.scoring_type?.toLowerCase() ||
                                      ""
                                    ).includes("range")
                                  ? "border-rose-100 bg-rose-50/50 text-rose-600"
                                  : "border-slate-100 bg-slate-50/50 text-slate-600",
                            "dark:border-opacity-20 dark:bg-transparent dark:text-opacity-80",
                          )}
                        >
                          {evaluator.scoring_type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {isLoadingCounts ? (
                          <div className="h-4 w-8 animate-pulse rounded bg-muted"></div>
                        ) : onlineCount > 0 ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-green-100 bg-green-50/50 text-green-600",
                              "dark:border-green-800/20 dark:bg-transparent dark:text-green-400",
                              "inline-flex h-6 items-center gap-1.5 whitespace-nowrap px-3 py-1 text-xs",
                            )}
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                            </span>
                            {onlineCount} online
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-muted/50 bg-muted/10 text-muted-foreground",
                              "inline-flex h-6 items-center whitespace-nowrap px-3 py-1 text-xs",
                            )}
                          >
                            Offline
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {evaluator.created_at
                          ? formatDate(evaluator.created_at)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
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
