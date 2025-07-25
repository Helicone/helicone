import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hoverCard";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { InfoIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { getTimeAgo } from "../../../lib/sql/timeHelpers";
import { Col } from "../../layout/common/col";
import { Row } from "../../layout/common/row";
import { clsx } from "../../shared/clsx";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";

interface SessionNameSelectionProps {
  sessionNameSearch?: string;
  setSessionNameSearch: (value?: string) => void;
  sessionNames: Array<{
    name: string;
    created_at: string;
    last_used: string;
    session_count: number;
  }>;
  selectedName?: string;
  setSelectedName: (name?: string) => void;
  totalSessionCount?: number;
}

const SessionNameSelection = ({
  sessionNameSearch,
  setSessionNameSearch,
  sessionNames,
  selectedName,
  setSelectedName,
}: SessionNameSelectionProps) => {
  const { freeLimit, hasAccess } = useFeatureLimit(
    "sessions",
    sessionNames.length,
  );

  // Sort the session names by last_used date (most recent first)
  const sortedSessions = [...sessionNames].sort(
    (a, b) => new Date(b.last_used).getTime() - new Date(a.last_used).getTime(),
  );

  // Filter sessions based on search or age criteria
  const filteredSessions = sortedSessions.filter((seshName) =>
    sessionNameSearch
      ? true
      : new Date(seshName.last_used).getTime() >
        new Date().getTime() - 45 * 24 * 60 * 60 * 1000,
  );

  // Function to handle session selection with free tier limit check
  const handleSessionSelect = (
    session: (typeof sessionNames)[0],
    index: number,
  ) => {
    if (!hasAccess && index >= freeLimit) {
      // This is a premium session, do not set as selected
      return;
    }

    if (session.name === selectedName) {
      setSelectedName(undefined);
      setSessionNameSearch(undefined);
    } else {
      setSelectedName(session.name);
      setSessionNameSearch(undefined);
    }
  };

  return (
    <Col className="min-h-[calc(100vh-56px)] min-w-[20em] place-items-stretch border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-black">
      <Row className="items-center border-b">
        <div className="flex w-full flex-1 items-center py-2 pl-2">
          {/* <SearchIcon className="h-4 w-4 text-slate-500 peer-focus-visible:bg-white h-full w" /> */}
          <Input
            className="mr-0 h-8 border-0 bg-transparent focus-visible:border focus-visible:border-0 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
            placeholder="Search session..."
            onChange={(e) => setSessionNameSearch(e.target.value)}
            value={sessionNameSearch}
          />
        </div>

        <Tooltip>
          <TooltipTrigger>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-none hover:cursor-pointer hover:bg-transparent"
            >
              <Link
                href="https://docs.helicone.ai/features/sessions"
                target="_blank"
              >
                <DocumentTextIcon className="h-4 w-4 text-slate-500 hover:cursor-pointer" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Card className="mb-1 px-2 py-1 text-xs">View documentation</Card>
          </TooltipContent>
        </Tooltip>
      </Row>

      <Col className="max-h-[70vh] overflow-y-auto">
        {filteredSessions.map((seshName, index) => {
          // Determine if this session requires premium (beyond free tier limit)
          const requiresPremium = !hasAccess && index >= freeLimit;

          return (
            <FreeTierLimitWrapper
              key={seshName.name}
              feature="sessions"
              itemCount={requiresPremium ? freeLimit + 1 : 0} // Trigger the upgrade modal only for premium sessions
            >
              <Card
                className={clsx(
                  "relative w-full cursor-pointer items-start rounded-none border-0 border-b p-4 text-left shadow-sm",
                  selectedName === seshName.name
                    ? "bg-sky-100 dark:bg-slate-900"
                    : requiresPremium
                      ? "bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-900/30 dark:hover:bg-slate-800/30"
                      : "hover:bg-sky-50 dark:hover:bg-slate-700/50",
                )}
                onClick={() => handleSessionSelect(seshName, index)}
              >
                <Row className="mb-2 flex w-full items-center justify-between gap-2">
                  <Row className="items-center gap-2">
                    {requiresPremium && (
                      <LockIcon className="h-3 w-3 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                    )}
                    {seshName.name === "" ? (
                      <div
                        className={clsx(
                          "text-sm font-semibold",
                          requiresPremium
                            ? "text-slate-400 dark:text-slate-600"
                            : "text-slate-400 dark:text-slate-600",
                        )}
                      >
                        Unnamed
                      </div>
                    ) : (
                      <div
                        className={clsx(
                          "text-sm font-semibold",
                          requiresPremium
                            ? "text-slate-500 dark:text-slate-500"
                            : "text-slate-900 dark:text-slate-300",
                        )}
                      >
                        {seshName.name}
                      </div>
                    )}
                    <HoverCard>
                      <HoverCardTrigger>
                        <InfoIcon
                          width={16}
                          height={16}
                          className={clsx(
                            "cursor-pointer",
                            requiresPremium
                              ? "text-slate-400 dark:text-slate-600"
                              : "text-slate-700",
                          )}
                        />
                      </HoverCardTrigger>
                      <HoverCardContent
                        align="start"
                        className="z-[1000] w-[220px] border border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-black"
                      >
                        <div className="flex flex-col gap-3 border-b border-slate-200 p-3">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Total sessions
                            </h3>
                            <p className="truncate text-sm text-slate-500">
                              {seshName.session_count}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Created on
                            </h3>
                            <p className="truncate text-sm text-slate-500">
                              {new Date(
                                seshName.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          {requiresPremium && (
                            <div className="flex flex-col gap-1">
                              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                Premium Access
                              </h3>
                              <p className="text-sm text-slate-500">
                                Upgrade to view this session
                              </p>
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </Row>

                  <div
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      selectedName === seshName.name
                        ? "border-sky-500 bg-sky-500 dark:border-sky-500/80 dark:bg-sky-500/80"
                        : requiresPremium
                          ? "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800"
                          : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-700/50",
                    )}
                  ></div>
                </Row>

                <Row
                  className={clsx(
                    "flex w-full items-center justify-between",
                    requiresPremium
                      ? "text-slate-400 dark:text-slate-600"
                      : "text-slate-500 dark:text-slate-500",
                  )}
                >
                  <p className="text-xs">
                    Last used{" "}
                    <span
                      className={clsx(
                        "font-medium",
                        requiresPremium
                          ? "text-slate-500 dark:text-slate-500"
                          : "text-slate-700 dark:text-slate-300",
                      )}
                    >
                      {getTimeAgo(new Date(seshName.last_used))}
                    </span>
                  </p>
                  <p className="text-xs">
                    <span
                      className={clsx(
                        "font-medium",
                        requiresPremium
                          ? "text-slate-500 dark:text-slate-500"
                          : "text-slate-700 dark:text-slate-300",
                      )}
                    >
                      {seshName.session_count}
                    </span>{" "}
                    session{+seshName.session_count === 1 ? "" : "s"}
                  </p>
                </Row>
              </Card>
            </FreeTierLimitWrapper>
          );
        })}
      </Col>
    </Col>
  );
};

export default SessionNameSelection;
