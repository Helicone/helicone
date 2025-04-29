import { P } from "@/components/ui/typography";
import { Col } from "../../layout/common/col";
import { useState } from "react";
import RateLimitRuleModal from "./RateLimitRuleModal";
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
import { Trash2, Pencil } from "lucide-react";
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
type UpdateRateLimitRuleParams =
  components["schemas"]["UpdateRateLimitRuleParams"];

const RateLimitRulesView = () => {
  const org = useOrg();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RateLimitRuleView | null>(
    null
  );
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

  const rules = data?.data?.data;
  const apiError = data?.data?.error;
  const networkError = error;

  // Helper function to determine segment priority level
  const getSegmentPriorityLevel = (
    segment: string | undefined | null
  ): number => {
    if (segment && segment !== "user") {
      return 1; // Property
    } else if (segment === "user") {
      return 2; // User
    } else {
      return 3; // Global
    }
  };

  // Helper function to calculate restrictiveness (lower is more restrictive)
  const calculateRestrictiveness = (rule: RateLimitRuleView): number => {
    if (rule.window_seconds <= 0) {
      return rule.quota > 0 ? -Infinity : Infinity; // Treat 0 window as ultra-restrictive if quota > 0
    }
    // We don't need to multiply by 60 if we just compare relative restrictiveness
    return rule.quota / rule.window_seconds;
  };

  // Sort rules: 1. Segment Priority, 2. Restrictiveness (if units match), 3. Name
  const sortedRules = rules
    ? [...rules].sort((a, b) => {
        const priorityA = getSegmentPriorityLevel(a.segment);
        const priorityB = getSegmentPriorityLevel(b.segment);

        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Sort by segment level (1, 2, 3)
        }

        // If segment levels are the same, compare restrictiveness only if units also match
        if (a.unit === b.unit) {
          const restrictivenessA = calculateRestrictiveness(a);
          const restrictivenessB = calculateRestrictiveness(b);
          if (restrictivenessA !== restrictivenessB) {
            return restrictivenessA - restrictivenessB; // Sort by restrictiveness (lower is more restrictive)
          }
        }

        // Fallback to sorting by name
        return a.name.localeCompare(b.name);
      })
    : [];

  const handleModalSuccess = (rule: RateLimitRuleView) => {
    const message = editingRule
      ? `Successfully updated rate limit rule "${rule.name}"`
      : `Successfully created rate limit rule "${rule.name}"`;
    setNotification(message, "success");
    if (editingRule) {
      setEditingRule(null);
    }
  };

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
        {isLoading && <LoadingAnimation />}

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

        {!isLoading &&
          !isError &&
          !apiError &&
          sortedRules &&
          sortedRules.length > 0 && (
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
                    {sortedRules.map((rule) => {
                      let appliesToElement: React.ReactNode = (
                        <Badge variant="secondary">Global</Badge>
                      );
                      if (rule.segment === "user") {
                        appliesToElement = (
                          <Badge variant="default">User</Badge>
                        );
                      } else if (rule.segment) {
                        appliesToElement = (
                          <Badge variant="outline">{`Property: ${rule.segment}`}</Badge>
                        );
                      }

                      let unitElement: React.ReactNode = (
                        <Badge variant="outline">
                          {rule.unit === "request"
                            ? "Requests"
                            : rule.unit === "cents"
                            ? "Cents"
                            : rule.unit}
                        </Badge>
                      );

                      return (
                        <TableRow
                          key={rule.id}
                          className="hover:bg-muted/25 transition-colors border-b border-border/40 dark:border-slate-800/40 last:border-0"
                        >
                          <TableCell className="font-medium py-3 px-4">
                            {rule.name}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {rule.quota.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {unitElement}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {rule.window_seconds.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {appliesToElement}
                          </TableCell>
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
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRule(rule);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Pencil size={15} className="text-blue-600" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
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
                                <AlertDialogContent
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                            </div>
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

      <RateLimitRuleModal
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingRule(null);
          }
        }}
        onSuccess={handleModalSuccess}
        rule={editingRule ?? undefined}
      />
    </Col>
  );
};

export default RateLimitRulesView;

// ("use client");

// import * as React from "react";
// import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";

// export const description = "An interactive bar chart";

// const chartData = [
//   { date: "2024-04-01", desktop: 222, mobile: 150 },
//   { date: "2024-04-02", desktop: 97, mobile: 180 },
//   { date: "2024-04-03", desktop: 167, mobile: 120 },
//   { date: "2024-04-04", desktop: 242, mobile: 260 },
//   { date: "2024-04-05", desktop: 373, mobile: 290 },
//   { date: "2024-04-06", desktop: 301, mobile: 340 },
//   { date: "2024-04-07", desktop: 245, mobile: 180 },
//   { date: "2024-04-08", desktop: 409, mobile: 320 },
//   { date: "2024-04-09", desktop: 59, mobile: 110 },
//   { date: "2024-04-10", desktop: 261, mobile: 190 },
//   { date: "2024-04-11", desktop: 327, mobile: 350 },
//   { date: "2024-04-12", desktop: 292, mobile: 210 },
//   { date: "2024-04-13", desktop: 342, mobile: 380 },
//   { date: "2024-04-14", desktop: 137, mobile: 220 },
//   { date: "2024-04-15", desktop: 120, mobile: 170 },
//   { date: "2024-04-16", desktop: 138, mobile: 190 },
//   { date: "2024-04-17", desktop: 446, mobile: 360 },
//   { date: "2024-04-18", desktop: 364, mobile: 410 },
//   { date: "2024-04-19", desktop: 243, mobile: 180 },
//   { date: "2024-04-20", desktop: 89, mobile: 150 },
//   { date: "2024-04-21", desktop: 137, mobile: 200 },
//   { date: "2024-04-22", desktop: 224, mobile: 170 },
//   { date: "2024-04-23", desktop: 138, mobile: 230 },
//   { date: "2024-04-24", desktop: 387, mobile: 290 },
//   { date: "2024-04-25", desktop: 215, mobile: 250 },
//   { date: "2024-04-26", desktop: 75, mobile: 130 },
//   { date: "2024-04-27", desktop: 383, mobile: 420 },
//   { date: "2024-04-28", desktop: 122, mobile: 180 },
//   { date: "2024-04-29", desktop: 315, mobile: 240 },
//   { date: "2024-04-30", desktop: 454, mobile: 380 },
//   { date: "2024-05-01", desktop: 165, mobile: 220 },
//   { date: "2024-05-02", desktop: 293, mobile: 310 },
//   { date: "2024-05-03", desktop: 247, mobile: 190 },
//   { date: "2024-05-04", desktop: 385, mobile: 420 },
//   { date: "2024-05-05", desktop: 481, mobile: 390 },
//   { date: "2024-05-06", desktop: 498, mobile: 520 },
//   { date: "2024-05-07", desktop: 388, mobile: 300 },
//   { date: "2024-05-08", desktop: 149, mobile: 210 },
//   { date: "2024-05-09", desktop: 227, mobile: 180 },
//   { date: "2024-05-10", desktop: 293, mobile: 330 },
//   { date: "2024-05-11", desktop: 335, mobile: 270 },
//   { date: "2024-05-12", desktop: 197, mobile: 240 },
//   { date: "2024-05-13", desktop: 197, mobile: 160 },
//   { date: "2024-05-14", desktop: 448, mobile: 490 },
//   { date: "2024-05-15", desktop: 473, mobile: 380 },
//   { date: "2024-05-16", desktop: 338, mobile: 400 },
//   { date: "2024-05-17", desktop: 499, mobile: 420 },
//   { date: "2024-05-18", desktop: 315, mobile: 350 },
//   { date: "2024-05-19", desktop: 235, mobile: 180 },
//   { date: "2024-05-20", desktop: 177, mobile: 230 },
//   { date: "2024-05-21", desktop: 82, mobile: 140 },
//   { date: "2024-05-22", desktop: 81, mobile: 120 },
//   { date: "2024-05-23", desktop: 252, mobile: 290 },
//   { date: "2024-05-24", desktop: 294, mobile: 220 },
//   { date: "2024-05-25", desktop: 201, mobile: 250 },
//   { date: "2024-05-26", desktop: 213, mobile: 170 },
//   { date: "2024-05-27", desktop: 420, mobile: 460 },
//   { date: "2024-05-28", desktop: 233, mobile: 190 },
//   { date: "2024-05-29", desktop: 78, mobile: 130 },
//   { date: "2024-05-30", desktop: 340, mobile: 280 },
//   { date: "2024-05-31", desktop: 178, mobile: 230 },
//   { date: "2024-06-01", desktop: 178, mobile: 200 },
//   { date: "2024-06-02", desktop: 470, mobile: 410 },
//   { date: "2024-06-03", desktop: 103, mobile: 160 },
//   { date: "2024-06-04", desktop: 439, mobile: 380 },
//   { date: "2024-06-05", desktop: 88, mobile: 140 },
//   { date: "2024-06-06", desktop: 294, mobile: 250 },
//   { date: "2024-06-07", desktop: 323, mobile: 370 },
//   { date: "2024-06-08", desktop: 385, mobile: 320 },
//   { date: "2024-06-09", desktop: 438, mobile: 480 },
//   { date: "2024-06-10", desktop: 155, mobile: 200 },
//   { date: "2024-06-11", desktop: 92, mobile: 150 },
//   { date: "2024-06-12", desktop: 492, mobile: 420 },
//   { date: "2024-06-13", desktop: 81, mobile: 130 },
//   { date: "2024-06-14", desktop: 426, mobile: 380 },
//   { date: "2024-06-15", desktop: 307, mobile: 350 },
//   { date: "2024-06-16", desktop: 371, mobile: 310 },
//   { date: "2024-06-17", desktop: 475, mobile: 520 },
//   { date: "2024-06-18", desktop: 107, mobile: 170 },
//   { date: "2024-06-19", desktop: 341, mobile: 290 },
//   { date: "2024-06-20", desktop: 408, mobile: 450 },
//   { date: "2024-06-21", desktop: 169, mobile: 210 },
//   { date: "2024-06-22", desktop: 317, mobile: 270 },
//   { date: "2024-06-23", desktop: 480, mobile: 530 },
//   { date: "2024-06-24", desktop: 132, mobile: 180 },
//   { date: "2024-06-25", desktop: 141, mobile: 190 },
//   { date: "2024-06-26", desktop: 434, mobile: 380 },
//   { date: "2024-06-27", desktop: 448, mobile: 490 },
//   { date: "2024-06-28", desktop: 149, mobile: 200 },
//   { date: "2024-06-29", desktop: 103, mobile: 160 },
//   { date: "2024-06-30", desktop: 446, mobile: 400 },
// ];

// const chartConfig = {
//   views: {
//     label: "Page Views",
//   },
//   desktop: {
//     label: "Desktop",
//     color: "hsl(var(--chart-1))",
//   },
//   mobile: {
//     label: "Mobile",
//     color: "hsl(var(--chart-2))",
//   },
// } satisfies ChartConfig;

// export function Component() {
//   const [activeChart, setActiveChart] =
//     React.useState<keyof typeof chartConfig>("desktop");

//   const total = React.useMemo(
//     () => ({
//       desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
//       mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
//     }),
//     []
//   );

//   return (
//     <Card>
//       <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
//         <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
//           <CardTitle>Bar Chart - Interactive</CardTitle>
//           <CardDescription>
//             Showing total visitors for the last 3 months
//           </CardDescription>
//         </div>
//         <div className="flex">
//           {["desktop", "mobile"].map((key) => {
//             const chart = key as keyof typeof chartConfig;
//             return (
//               <button
//                 key={chart}
//                 data-active={activeChart === chart}
//                 className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
//                 onClick={() => setActiveChart(chart)}
//               >
//                 <span className="text-xs text-muted-foreground">
//                   {chartConfig[chart].label}
//                 </span>
//                 <span className="text-lg font-bold leading-none sm:text-3xl">
//                   {total[key as keyof typeof total].toLocaleString()}
//                 </span>
//               </button>
//             );
//           })}
//         </div>
//       </CardHeader>
//       <CardContent className="px-2 sm:p-6">
//         <ChartContainer
//           config={chartConfig}
//           className="aspect-auto h-[250px] w-full"
//         >
//           <BarChart
//             accessibilityLayer
//             data={chartData}
//             margin={{
//               left: 12,
//               right: 12,
//             }}
//           >
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="date"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               minTickGap={32}
//               tickFormatter={(value) => {
//                 const date = new Date(value);
//                 return date.toLocaleDateString("en-US", {
//                   month: "short",
//                   day: "numeric",
//                 });
//               }}
//             />
//             <ChartTooltip
//               content={
//                 <ChartTooltipContent
//                   className="w-[150px]"
//                   nameKey="views"
//                   labelFormatter={(value) => {
//                     return new Date(value).toLocaleDateString("en-US", {
//                       month: "short",
//                       day: "numeric",
//                       year: "numeric",
//                     });
//                   }}
//                 />
//               }
//             />
//             <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
//           </BarChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   );
// }
