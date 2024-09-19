import { useState } from "react";
import { useOrgPlanPage } from "../organization/plan/useOrgPlanPage";
import {
  addMonths,
  endOfMonth,
  formatISO,
  isAfter,
  startOfMonth,
  subMonths,
} from "date-fns";
import { BarChart } from "@tremor/react";
import { getTimeMap } from "../../../lib/timeCalculations/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useNotification from "../../shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RateLimitPage = () => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const timeIncrement = "day";

  const startOfMonthFormatted = formatISO(currentMonth, {
    representation: "date",
  });
  const endOfMonthFormatted = formatISO(endOfMonth(currentMonth), {
    representation: "date",
  });

  const {
    overTimeData,
    metrics,
    refetch: refetchData,
    isLoading,
  } = useOrgPlanPage({
    timeFilter: {
      start: currentMonth,
      end: endOfMonth(currentMonth),
    },
    timeZoneDifference: 0,
    dbIncrement: timeIncrement,
  });

  const nextMonth = () => {
    setCurrentMonth((prevMonth) => startOfMonth(addMonths(prevMonth, 1)));
  };

  const prevMonth = () => {
    setCurrentMonth((prevMonth) => startOfMonth(subMonths(prevMonth, 1)));
  };

  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("default", { month: "long" });
  };

  const isNextMonthDisabled = isAfter(addMonths(currentMonth, 1), new Date());
  const { setNotification } = useNotification();

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-3xl font-bold">
              {getMonthName(startOfMonthFormatted)}
            </CardTitle>
            {!isNextMonthDisabled && (
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold">
            Your requests are never dropped and will always be returned to the
            client. Helicone will always do its best effort to make sure the
            user gets their request.
          </p>
          <p className="text-muted-foreground">
            Below is a summary of the rate-limiting{" "}
            <span className="font-semibold">logged</span> occurrences for your
            organization last month. This simply indicates that some of your
            requests were processed but not logged in your dashboard due to
            reaching a rate limit - If you&apos;d like to increase your rate
            limit, please feel free to reach out to us at{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => {
                navigator.clipboard.writeText("sales@helicone.ai");
                setNotification("Email copied to clipboard", "success");
              }}
            >
              sales@helicone.ai
            </Button>
            .
          </p>
        </CardContent>
      </Card>

      {!isLoading && metrics.totalRateLimits.data && (
        <Card>
          <CardHeader>
            <CardTitle>Rate-Limits this month</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              className="h-[14rem]"
              data={
                overTimeData.rateLimits.data?.data?.map((r) => ({
                  date: getTimeMap(timeIncrement)(r.time),
                  "rate-limits": r.count,
                })) ?? []
              }
              index="date"
              categories={["rate-limits"]}
              colors={["cyan"]}
              showYAxis={false}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Rate limits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Free</TableCell>
                <TableCell>834 logs / 5 seconds</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pro</TableCell>
                <TableCell>8334 logs / 5 seconds</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Enterprise</TableCell>
                <TableCell>Custom</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RateLimitPage;
