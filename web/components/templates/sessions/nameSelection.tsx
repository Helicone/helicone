import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { getTimeAgo } from "../../../lib/sql/timeHelpers";
import { Col } from "../../layout/common/col";
import { clsx } from "../../shared/clsx";
import { Row } from "../../layout/common/row";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { TooltipTrigger, Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { HoverCardContent, HoverCardTrigger } from "@/components/ui/hoverCard";
import { HoverCard } from "@/components/ui/hoverCard";
import { TooltipContent } from "@radix-ui/react-tooltip";

interface SessionNameSelectionProps {
  sessionIdSearch: string;
  setSessionIdSearch: (value: string) => void;
  sessionNameSearch: string;
  setSessionNameSearch: (value: string) => void;
  sessionNames: Array<{
    name: string;
    created_at: string;
    total_cost: number;
    last_used: string;
    session_count: number;
  }>;
  selectedName: string;
  setSelectedName: (name: string) => void;
}

const SessionNameSelection = ({
  sessionNameSearch,
  setSessionNameSearch,
  sessionIdSearch,
  setSessionIdSearch,
  sessionNames,
  selectedName,
  setSelectedName,
}: SessionNameSelectionProps) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  return (
    <Col className="min-w-[20em] min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-black border-r border-slate-200 dark:border-slate-800 place-items-stretch">
      <Row className="items-center border-b">
        <div className="w-full flex-1 pl-2 py-2 flex items-center">
          {/* <SearchIcon className="h-4 w-4 text-slate-500 peer-focus-visible:bg-white h-full w" /> */}
          <Input
            className="focus-visible:border focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:outline-none focus-visible:border-0 border-0 bg-transparent focus-visible:bg-white mr-0 h-8"
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
              className="hover:cursor-pointer rounded-none hover:bg-transparent"
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
            <Card className="py-1 px-2 text-xs mb-1">View doc</Card>
          </TooltipContent>
        </Tooltip>
      </Row>

      <Col className="max-h-[70vh] overflow-y-auto">
        {sessionNames.map((seshName) => (
          <Card
            key={seshName.name}
            className={clsx(
              "shadow-sm p-4 w-full items-start text-left rounded-none cursor-pointer border-0 border-b",
              selectedCard === seshName.name
                ? "bg-sky-100 dark:bg-slate-900"
                : "hover:bg-sky-50 dark:hover:bg-slate-700/50"
            )}
            onClick={() => {
              setSelectedName(seshName.name);
              setSelectedCard(seshName.name);
            }}
          >
            <Row className="flex w-full justify-between items-center gap-2 mb-2">
              <Row className="gap-2 items-center">
                {seshName.name === "" ? (
                  <div className="text-slate-400 dark:text-slate-600 font-semibold text-sm">
                    Unnamed
                  </div>
                ) : (
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-300">
                    {seshName.name}
                  </div>
                )}
                <HoverCard>
                  <HoverCardTrigger>
                    <InfoIcon
                      width={16}
                      height={16}
                      className="text-slate-700 cursor-pointer"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="start"
                    className="w-[220px] p-0 z-[1000] bg-white dark:bg-black border border-slate-200 dark:border-slate-800"
                  >
                    <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Total sessions
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {seshName.session_count}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Created on
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {new Date(seshName.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </Row>

              <div
                className={clsx(
                  "border border-slate-300 dark:border-slate-700 rounded-full h-4 w-4 flex items-center justify-center",
                  selectedCard === seshName.name
                    ? "bg-sky-500 dark:bg-sky-500/80"
                    : "bg-white dark:bg-slate-700/50"
                )}
              ></div>
            </Row>

            <Row className="flex w-full justify-between items-center text-slate-500 dark:text-slate-500">
              <p className="text-xs">
                Last used{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {getTimeAgo(new Date(seshName.last_used))}
                </span>
              </p>
              <p className="text-xs">
                Total cost $
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {seshName.total_cost.toFixed(2)}
                </span>
              </p>
            </Row>
          </Card>
        ))}
      </Col>
    </Col>
  );
};

export default SessionNameSelection;
