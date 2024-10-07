import { useLocalStorage } from "@/services/hooks/localStorage";
import { ChartPieIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useMemo } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useSessionNames } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Row } from "../../layout/common";
import { Col } from "../../layout/common/col";
import ThemedTable from "../../shared/themed/table/themedTable";
import { INITIAL_COLUMNS } from "./initialColumns";

import SessionMetrics from "./SessionMetrics";
import { PiGraphLight } from "react-icons/pi";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

const TABS = [
  {
    id: "sessions",
    label: "Sessions",
    icon: <ListBulletIcon className="w-4 h-4" />,
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: <ChartPieIcon className="w-4 h-4" />,
  },
];

type TSessions = {
  created_at: string;
  latest_request_created_at: string;
  session: string;
  total_cost: number;
  total_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type SessionResult = ReturnType<
  typeof useSessionNames
>["sessions"][number];
interface SessionDetailsProps {
  selectedSession: SessionResult | null;
  sessionIdSearch: string;
  setSessionIdSearch: (value: string) => void;
  sessions: TSessions[];
  isLoading: boolean;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  timeFilter: {
    start: Date;
    end: Date;
  };
  setTimeFilter: (filter: { start: Date; end: Date }) => void;
  setInterval: (interval: TimeInterval) => void;
}

const SessionDetails = ({
  selectedSession,
  sessionIdSearch,
  setSessionIdSearch,
  sessions,
  isLoading,
  sort,
  timeFilter,
  setTimeFilter,
  setInterval,
}: SessionDetailsProps) => {
  const router = useRouter();

  const totalCost = useMemo(() => {
    return sessions
      .reduce((acc, session) => acc + session.total_cost, 0)
      .toFixed(3);
  }, [sessions]);

  const [currentTab, setCurrentTab] = useLocalStorage<
    (typeof TABS)[number]["id"]
  >("session-details-tab", "sessions");

  if (selectedSession)
    return (
      <Col className="space-y-4 w-full border-r border-slate-200 dark:border-slate-800 py-2 overflow-x-auto">
        {/* <Card>
          <CardHeader>
            <CardTitle>{selectedSession?.name ?? "Unnamed Session"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="secondary">Total cost: ${totalCost}</Badge>
              <Badge variant="secondary">
                Created:{" "}
                {new Date(
                  selectedSession?.created_at ?? Date.now()
                ).toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card> */}

        <Tabs
          value={currentTab}
          onValueChange={(value) => setCurrentTab(value)}
          className="w-full"
        >
          <Row className="items-center justify-between gap-4 mb-2 px-4">
            <TabsList className="grid w-full grid-cols-2">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Row>

          <TabsContent value="sessions">
            <>
              <div className="mb-4 px-4">
                <Input
                  value={sessionIdSearch}
                  onChange={(e) => setSessionIdSearch(e.target.value)}
                  placeholder="Search session id..."
                  className="w-full"
                />
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800">
                <ThemedTable
                  id="session-table"
                  defaultData={sessions || []}
                  defaultColumns={INITIAL_COLUMNS}
                  skeletonLoading={isLoading}
                  dataLoading={false}
                  sortable={sort}
                  timeFilter={{
                    currentTimeFilter: timeFilter,
                    defaultValue: "all",
                    onTimeSelectHandler: (key: TimeInterval, value: string) => {
                      if ((key as string) === "custom") {
                        const [startDate, endDate] = value.split("_");

                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        setInterval(key);
                        setTimeFilter({
                          start,
                          end,
                        });
                      } else {
                        setInterval(key);
                        setTimeFilter({
                          start: getTimeIntervalAgo(key),
                          end: new Date(),
                        });
                      }
                    },
                  }}
                  onRowSelect={(row) => {
                    router.push(`/sessions/${row.session}`);
                  }}
                />
              </div>
            </>
          </TabsContent>

          <TabsContent value="metrics">
            <SessionMetrics selectedSession={selectedSession} />
          </TabsContent>
        </Tabs>
      </Col>
    );

  return (
    <div className="flex flex-col w-full h-96 justify-center items-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center pt-6">
          <PiGraphLight className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-xl mb-2">No Session Selected</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Please select a session to view its details
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionDetails;
