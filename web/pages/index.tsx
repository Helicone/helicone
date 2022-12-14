import { ArrowUpIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { SupabaseClient } from "@supabase/supabase-js";
import Head from "next/head";
import { useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";
import { DateMetrics } from "../components/timeGraph";
import { Logo } from "../components/logo";
import { RequestTable } from "../components/requestTable";
import { MetricsPanel } from "../components/metricsPanel";
import { Logs } from "../components/logPanel";
import { OnBoarding } from "../components/onBoarding";
import { ResetAPIKey } from "../components/resetAPIKey";
import { UserTable } from "../components/userTable";

function getStorageValue<T>(key: string, defaultValue: T) {
  const saved =
    typeof window !== "undefined" ? localStorage.getItem(key) : null;
  if (saved === null) {
    return defaultValue;
  }
  return JSON.parse(saved) as T;
}

function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default function Home() {
  const [authHash, setAuthHash] = useLocalStorage<string | null>(
    "authHashedToken",
    null
  );
  const [authPreview, setAuthPreview] = useLocalStorage<string | null>(
    "authPreview",
    null
  );

  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    if (authHash !== null) {
      supabaseClient(authHash).then((client) => {
        setClient(client);
      });
    } else {
      setClient(null);
    }
  }, [authHash]);

  return (
    <div className="flex flex-col bg-black text-slate-100">
      <Head>
        <title>Valyr better logging for OpenAI</title>
        <meta name="description" content="Valyr" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="items-center pt-5 pb-12 md:h-screen min-h-screen">
        {client !== null ? (
          <LoggedInFlow
            setAuthHash={setAuthHash}
            client={client}
            authPreview={authPreview!}
          />
        ) : (
          <div className="flex flex-col items-center">
            <h1 className="text-6xl text-center my-8">
              <div className="hidden md:flex md:flex-row gap-5 items-center">
                <div className="hidden md:block">Welcome to Valyr</div>
                <Logo />
              </div>
              <div className=" md:hidden flex flex-col items-center">
                Welcome to
                <div className="md:hidden flex flex-row gap-5 items-center">
                  <span>Valyr</span>
                  <Logo />
                </div>
              </div>
            </h1>
            <OnBoarding
              setAuthHash={setAuthHash}
              setAuthPreview={setAuthPreview}
            />
          </div>
        )}
      </main>

      <footer className="fixed left-0 bottom-0 z-20 h-12 w-full text-center border-t-2 dark:border-slate-800 border-slate-300 dark:bg-black bg-opacity-90">
        <div className="flex flex-row items-center justify-center h-full gap-1">
          <div>
            Made by <i>Helicone</i>
          </div>

          <div>
            {"("}
            <a
              href="https://twitter.com/justinstorre"
              className="dark:text-slate-300 text-slate-700"
            >
              Justin
            </a>{" "}
            <a
              href="https://twitter.com/barakoshri"
              className="dark:text-slate-300 text-slate-700"
            >
              Barak
            </a>{" "}
            <a
              href="https://twitter.com/NguyenScott7"
              className="dark:text-slate-300 text-slate-700"
            >
              Scott
            </a>
            {")"}
          </div>
        </div>
      </footer>
    </div>
  );
}
function LoggedInFlow({
  setAuthHash,
  client,
  authPreview,
}: {
  setAuthHash: (client: string | null) => void;
  client: SupabaseClient;
  authPreview: string;
}) {
  return (
    <div className="flex flex-col h-full px-10 pb-12">
      <div className="h-1/6 ">
        <ResetAPIKey setAuthHash={setAuthHash} authPreview={authPreview} />
      </div>
      <div className="h-2/6 w-full ">
        <div className="flex flex-col md:flex-row gap-8 ">
          <div className="flex-1 border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center">
            <MetricsPanel client={client} />
          </div>
          <div className="flex-1 border-[1px] text-xs border-slate-700 rounded-lg px-5 py-3 max-h-60 overflow-y-auto ">
            {/* This is a vertically scrollable table */}
            <div className="flex flex-row justify-between">
              <div className="flex flex-row gap-2">
                <InformationCircleIcon className="h-5 w-5 text-slate-300" />
                <p className="text-slate-600 dark:text-slate-300">Logs</p>
              </div>
              <div className="flex flex-row gap-2">
                <p className="dark:text-slate-300 text-slate-600 animate-pulse">
                  Live
                </p>
                <ArrowUpIcon className="h-5 w-5 text-slate-300" />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              Live logs coming soon!
              <Logs client={client} />
            </div>
          </div>
        </div>
      </div>
      <div className="h-3/6 w-full ">
        <GraphAndCharts client={client} />
      </div>
    </div>
  );
}

function GraphAndCharts({ client }: { client: SupabaseClient }) {
  type View = "Graph" | "Requests" | "Users";

  const [currentView, setCurrentView] = useState<View>("Graph");

  const differentViews: {
    name: View;
    component: JSX.Element;
  }[] = [
    {
      name: "Graph",
      component: <TimeGraphWHeader client={client} />,
    },
    {
      name: "Requests",
      component: <RequestTable client={client} />,
    },
    {
      name: "Users",
      component: <UserTable client={client} />,
    },
  ];

  return (
    <>
      <div className="h-[10%] w-full pl-10 flex flex-col gap-3 mt-4">
        <div className="flex flex-row gap-5 items-center">
          <div className="border-2 dark:border-none dark:bg-slate-800 rounded-full flex flex-row gap-2">
            {differentViews.map((view) => (
              <div
                className={
                  "flex flex-row gap-2 items-center px-10 rounded-full py-1 cursor-pointer " +
                  (view.name !== currentView ||
                    "dark:bg-slate-600 bg-slate-500")
                }
                onClick={() => setCurrentView(view.name)}
                key={view.name}
              >
                <p
                  className={
                    view.name === currentView
                      ? "dark:text-slate-100 "
                      : "dark:text-slate-200 text-slate-100"
                  }
                >
                  {view.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-[90%] py-5">
        {differentViews.find((view) => view.name === currentView)?.component}
      </div>
    </>
  );
}

function TimeGraphWHeader({ client }: { client: SupabaseClient }) {
  return (
    <div className="h-full w-full">
      <div className="w-full h-1/6 pl-10">
        <p className="text-lg text-slate-300">Number of requests over time</p>
      </div>
      <div className="w-full md:h-5/6 h-40">
        <DateMetrics client={client} />
      </div>
    </div>
  );
}
