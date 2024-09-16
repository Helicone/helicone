import { BookOpenIcon } from "@heroicons/react/24/outline";
import { Divider, Badge } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useSessionNames, useSessions } from "../../../services/hooks/sessions";
import { SortDirection } from "../../../services/lib/sorts/users/sorts";
import { Row } from "../../layout/common/row";
import AuthHeader from "../../shared/authHeader";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { DiffHighlight } from "../welcome/diffHighlight";
import SessionNameSelection from "./nameSelection";
import SessionDetails from "./sessionDetails";
import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";

interface SessionsPageProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: number;
}
const SessionsPage = (props: SessionsPageProps) => {
  const { currentPage, pageSize, sort, defaultIndex } = props;

  const [interval, setInterval] = useState<TimeInterval>("24h");

  const [timeFilter, setTimeFilter] = useState<{
    start: Date;
    end: Date;
  }>({
    start: getTimeIntervalAgo(interval),
    end: new Date(),
  });

  const [sessionIdSearch, setSessionIdSearch] = useState<string>("");
  const names = useSessionNames(sessionIdSearch ?? "");

  const debouncedSessionIdSearch = useDebounce(sessionIdSearch, 500); // 0.5 seconds
  const [selectedName, setSelectedName] = useState<string>("");

  const { sessions, refetch, isLoading } = useSessions(
    timeFilter,
    debouncedSessionIdSearch,
    selectedName
  );

  const [hasSomeSessions, setHasSomeSessions] = useState<boolean | null>(null);

  const org = useOrg();

  useEffect(() => {
    if (hasSomeSessions === null && !names.isLoading) {
      setHasSomeSessions(names.sessions.length > 0);
    }
  }, [hasSomeSessions, names.sessions.length, names.isLoading]);

  return (
    <>
      <AuthHeader
        title={
          <div className="flex items-center gap-2">
            Sessions <Badge size="sm">Beta</Badge>
          </div>
        }
      />
      <div>
        {!isLoading &&
        org?.currentOrg?.tier !== "free" &&
        (hasSomeSessions || hasSomeSessions === null) ? (
          <Row className="gap-5 ">
            <SessionNameSelection
              sessionIdSearch={sessionIdSearch}
              setSessionIdSearch={setSessionIdSearch}
              selectedName={selectedName}
              setSelectedName={setSelectedName}
              sessionNames={names.sessions}
            />
            <SessionDetails
              selectedSession={
                names.sessions.find(
                  (session) => session.name === selectedName
                ) ?? null
              }
              sessionIdSearch={sessionIdSearch}
              setSessionIdSearch={setSessionIdSearch}
              sessions={sessions}
              isLoading={isLoading}
              sort={sort}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              setInterval={setInterval}
            />
          </Row>
        ) : (
          <div className="flex flex-col w-full mt-16 justify-center items-center">
            <div className="flex flex-col">
              <div className="w-fit pt-2 pl-0.5 bg-white border border-gray-300 rounded-md">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 flex items-center justify-center ml-2"
                >
                  <path
                    d="M16.0313 9.70305H12.9095V6.89055C12.9095 5.90618 12.122 5.11868 11.1376 5.11868H8.3251V2.30618C8.3251 1.3218 7.5376 0.534302 6.55322 0.534302H2.27822C1.29385 0.534302 0.506348 1.3218 0.506348 2.30618V6.55305C0.506348 7.53743 1.29385 8.32493 2.27822 8.32493H5.09072V11.1374C5.09072 12.1218 5.87822 12.9093 6.8626 12.9093H9.6751V16.0312C9.6751 16.8468 10.3501 17.4937 11.1376 17.4937H16.0313C16.847 17.4937 17.4938 16.8187 17.4938 16.0312V11.1656C17.4938 10.3781 16.847 9.70305 16.0313 9.70305ZM2.27822 7.03118C1.99697 7.03118 1.77197 6.80618 1.77197 6.52493V2.27805C1.77197 1.9968 1.99697 1.7718 2.27822 1.7718H6.5251C6.80635 1.7718 7.03135 1.9968 7.03135 2.27805V5.09055H6.8626C5.87822 5.09055 5.09072 5.87805 5.09072 6.86243V7.03118H2.27822ZM6.8626 11.6437C6.58135 11.6437 6.35635 11.4187 6.35635 11.1374V6.86243C6.35635 6.58118 6.58135 6.35618 6.8626 6.35618H11.1095C11.3907 6.35618 11.6157 6.58118 11.6157 6.86243V9.67493H11.1657C10.3501 9.67493 9.70322 10.3499 9.70322 11.1374V11.5874H6.8626V11.6437ZM16.2563 16.0312C16.2563 16.1437 16.172 16.2562 16.0313 16.2562H11.1657C11.0532 16.2562 10.9407 16.1718 10.9407 16.0312V11.1656C10.9407 11.0531 11.0251 10.9406 11.1657 10.9406H16.0313C16.1438 10.9406 16.2563 11.0249 16.2563 11.1656V16.0312Z"
                    fill="#111928"
                  />
                </svg>
              </div>

              <p className="text-xl text-black dark:text-white font-semibold mt-8">
                {org?.currentOrg?.tier === "free"
                  ? "Upgrade to Pro to start logging sessions"
                  : "No Sessions Found"}
              </p>
              <p className="text-sm text-gray-500 max-w-sm mt-2">
                View our documentation to learn how to log sessions.
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="https://docs.helicone.ai/features/sessions"
                  className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  View Docs
                </Link>
                {
                  <Link href="/settings/billing">
                    <Button className="bg-sky-500 hover:bg-sky-600">
                      Start free trial
                    </Button>
                  </Link>
                }
              </div>
              <div className="mt-4 w-full max-w-lg">
                <video
                  width="100%"
                  height="100%"
                  autoPlay
                  muted
                  loop
                  className="rounded-lg shadow-lg"
                >
                  <source
                    src="https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/sessions.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
              {org?.currentOrg?.tier !== "free" && (
                <div>
                  <Divider>Or</Divider>

                  <div className="mt-4">
                    <h3 className="text-xl text-black dark:text-white font-semibold">
                      TS/JS Quick Start
                    </h3>
                    <DiffHighlight
                      code={`
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": \`Bearer ${process.env.HELICONE_API_KEY}\`,
  },
});

const session = randomUUID();

openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        content: "Generate an abstract for a course on space.",
      },
    ],
    model: "gpt-4",
  },
  {
    headers: {
      "Helicone-Session-Id": session,
      "Helicone-Session-Path": "/abstract",
    },
  }
);
`}
                      language="typescript"
                      newLines={[]}
                      oldLines={[]}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SessionsPage;
