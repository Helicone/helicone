import {
  ArrowDownIcon,
  ArrowUpIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import Head from "next/head";
import { useEffect, useState } from "react";

import { hashAuth, supabaseClient } from "../lib/supabaseClient";
import { Request as ValyrRequest } from "../schema/request";
import { ValyrResponse } from "../schema/resoponse";
import { DateMetrics } from "../components/timeGraph";
import Image from "next/image";
import { Logo } from "../components/logo";
import { MetricsDB } from "../schema/metrics";

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
interface Log {
  event: "request" | "response";
  id: string;
  created_at: Date;
  body: string;
}
function Logs({ client }: { client: SupabaseClient }) {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    console.log("Fetching logs");
    const channel = client.channel("db-messages");
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "request" },
      (payload) => {
        console.log("REQUEST", payload);
        const request: ValyrRequest = payload.new as unknown as ValyrRequest;
        setLogs((logs) =>
          logs.concat([
            {
              event: "request",
              id: request.id,
              created_at: new Date(request.created_at),
              body: JSON.stringify(request.body),
            },
          ])
        );
      }
    );
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "response" },
      (payload) => {
        console.log("RESPONSE", payload);
        const response: ValyrResponse = payload.new as unknown as ValyrResponse;
        setLogs((logs) =>
          logs.concat([
            {
              event: "response",
              id: response.id,
              created_at: new Date(response.created_at),
              body: JSON.stringify(response.body),
            },
          ])
        );
      }
    );
    channel.subscribe(async (status) => {
      console.log("STATUS", status);
    });
  }, [client]);

  return (
    <div>
      {logs.reverse().map((log) => (
        <LogCard log={log} key={log.id} />
      ))}
    </div>
  );
}

function LogCard({ log: l, key }: { log: Log; key: string }): JSX.Element {
  return (
    <div
      key={key}
      className="flex flex-row justify-between items-center border-[1px] border-slate-700 rounded-lg px-5 py-3"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <p className="text-slate-300">{l.event}</p>
          <p className="text-slate-300">{l.created_at.toLocaleString()}</p>
        </div>
        <div className="flex flex-row gap-2">
          <p className="text-slate-300">{middleTruncString(l.body, 50)}</p>
        </div>
      </div>
      <DocumentDuplicateIcon
        className="h-5 w-5 text-slate-300 hover:cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(l.body);
        }}
      />
    </div>
  );
}

function GraphAndCharts({ client }: { client: SupabaseClient }) {
  const [showRequestTable, setShowRequestTable] = useState(false);
  return (
    <>
      <div className="h-[10%] w-full pl-10 flex flex-col gap-3 mt-4">
        <div className="flex flex-row gap-5 items-center">
          <div className="border-2 dark:border-none dark:bg-slate-800 rounded-full flex flex-row gap-2">
            <div
              className={
                "flex flex-row gap-2 items-center px-10 rounded-full py-1 cursor-pointer " +
                (showRequestTable || "dark:bg-slate-600 bg-slate-500")
              }
              onClick={() => setShowRequestTable(false)}
            >
              <p
                className={
                  showRequestTable
                    ? "dark:text-slate-100 "
                    : "dark:text-slate-200 text-slate-100"
                }
              >
                Graph
              </p>
            </div>
            <div
              className={
                "flex flex-row gap-2 items-center px-10 rounded-full py-1 cursor-pointer " +
                (showRequestTable && "dark:bg-slate-600 bg-slate-500")
              }
              onClick={() => setShowRequestTable(true)}
            >
              <p
                className={
                  showRequestTable
                    ? "dark:text-slate-200 text-slate-100"
                    : "dark:text-slate-100 "
                }
              >
                Table
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-[90%] py-5">
        {showRequestTable ? (
          <RequestTable client={client} />
        ) : (
          <TimeGraphWHeader client={client} />
        )}
      </div>
    </>
  );
}

interface RequestTableRow {
  time: string;
  request: string;
  response: string;
  duration: string;
  tokenCount: number;
}

interface ResponseAndRequest {
  response_body: any;
  response_id: string;
  response_created_at: string;
  request_id: string;
  request_body: any;
  request_path: string;
  request_created_at: string;
}

function truncString(str: string, n: number) {
  return str.length > n ? str.substring(0, n - 1) + "..." : str;
}

function middleTruncString(str: string, n: number) {
  return str.length > n
    ? str.substring(0, n / 2) +
        "..." +
        str.substring(str.length - n / 2, str.length)
    : str;
}

function RequestTable({ client }: { client: SupabaseClient }) {
  const [data, setData] = useState<ResponseAndRequest[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await client
        .from("response_and_request")
        .select("*")
        .order("request_created_at", { ascending: false })
        .limit(1000);
      if (error) {
        console.log(error);
      } else {
        setData(data);
      }
    };
    fetch();
  }, [client]);
  console.log(data[0]);
  const probabilities = data.map((d) => {
    const choice = d.response_body?.choices
      ? d.response_body?.choices[0]
      : null;
    if (!choice) {
      return null;
    }

    var prob;
    if (choice.logprobs !== undefined && choice.logprobs !== null) {
      const tokenLogprobs = choice.logprobs.token_logprobs;
      const sum = tokenLogprobs.reduce(
        (total: any, num: any) => total + num,
        0
      );
      prob = Math.pow(Math.E, sum);
      prob = (prob * 100).toFixed(3).concat("%");
    } else {
      prob = "";
    }

    return prob;
  });

  return (
    <div className="h-full">
      <div>
        <span>Showing the most recent {} </span>
        <span className="font-thin text-xs">(max 1000)</span>
      </div>
      <div className="h-full overflow-y-auto mt-3">
        <table className="w-full mt-5 table-auto ">
          <thead>
            <tr className="text-slate-300">
              <th className="text-left">Time</th>
              <th className="text-left">Request</th>
              <th className="text-left">Response</th>
              <th className="text-left">Duration</th>
              <th className="text-left">Token Count</th>
              <th className="text-left">Probability</th>
              <th className="text-left">Copy</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr className="text-slate-300" key={row.request_id}>
                <td>{new Date(row.request_created_at).toLocaleString()}</td>
                <td>{truncString(row.request_body.prompt, 15)}</td>
                <td>
                  {truncString(
                    row.response_body.choices
                      ? row.response_body.choices[0].text
                      : "{{ no reponse }}",
                    15
                  )}
                </td>
                <td>
                  {(
                    (new Date(row.response_created_at).getTime() -
                      new Date(row.request_created_at).getTime()) /
                    1000
                  ).toString()}{" "}
                  s
                </td>
                <td>
                  {row.response_body.usage
                    ? row.response_body.usage.total_tokens
                    : "{{ no tokens found }}"}
                </td>
                <td>{probabilities[i]}</td>
                <td>
                  <DocumentDuplicateIcon
                    className="h-5 w-5 text-slate-300 hover:cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(row));
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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

function MetricsPanel({ client }: { client: SupabaseClient }) {
  interface Metrics {
    request_today: number;
    average_requests_per_day: number;
    average_response_time: number;
    average_tokens_per_request: number;
    average_tokens_per_response: number;
    average_cost_per_request: number;
    total_requests: number;
  }

  const [data, setData] = useState<Metrics | null>(null);
  console.log("data", data);
  const metrics = [
    {
      value: data?.request_today ?? "n/a",
      label: "Requests today",
    },
    {
      value: data?.average_requests_per_day.toFixed(3) ?? "n/a",
      label: "Average requests per day",
    },
    {
      value: data?.average_response_time.toFixed(3) ?? "n/a",
      label: "Average response time",
    },
    {
      value: data?.average_tokens_per_response.toFixed(3) ?? "n/a",
      label: "Average # of Token/response",
    },
    {
      value: data?.average_cost_per_request ?? "n/a",
      label: "Average cost/request",
    },
    {
      value: data?.total_requests ?? "n/a",
      label: "Total requests",
    },
  ];
  useEffect(() => {
    const fetch = async () => {
      const { count: requestToday, error: requestTodayError } = await client
        .from("response")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("created_at", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      const {
        data: metrics,
        error: metricsError,
      }: { data: MetricsDB | null; error: PostgrestError | null } = await client
        .from("metrics")
        .select("*")
        .single();

      if (metricsError !== null) {
        console.error(metricsError);
      } else if (requestTodayError !== null) {
        console.error(requestTodayError);
      } else {
        setData({
          request_today: requestToday!, //TODO
          average_cost_per_request: undefined!,
          ...metrics!,
        });
      }
    };
    fetch();
  }, [client]);

  return (
    <div className="grid grid-cols-5 gap-2">
      {metrics.map((m) => (
        <>
          <div className="col-span-3">{m.label}</div>
          <div className="text-indigo-400 font-bold text-right col-span-2">
            {m.value}
          </div>
        </>
      ))}
    </div>
  );
}

function ResetAPIKey({
  setAuthHash,
  authPreview,
}: {
  setAuthHash: (client: string | null) => void;
  authPreview: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {authPreview === "Demo...Demo" ? (
        <div className="flex flex-col gap-2 items-center">
          <div className="flex flex-row justify-center items-center gap-4">
            <ExclamationCircleIcon className="h-6 w-6 text-slate-300" />
            <p className="dark:text-slate-300 text-slate-600">
              You are currently using the demo API Key.
            </p>
          </div>
          <div>
            All of the data associated with this API Key is coming from
            <a
              href="https://demoapp.valyrai.com/"
              className="text-indigo-400 font-bold hover:underline"
            >
              {" "}
              this demo app
            </a>
            .
          </div>
        </div>
      ) : (
        <div className="flex flex-row justify-center items-center gap-4">
          <InformationCircleIcon className="h-6 w-6 text-slate-300" />
          <p className="text-slate-300">
            You are currently viewing API Key{" "}
            <i className="text-slate-300 font-bold">{authPreview}</i>
          </p>
        </div>
      )}

      <div className="flex flex-row justify-center items-center gap-4">
        <button
          className="px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100"
          onClick={() => {
            setAuthHash(null);
          }}
        >
          Reset API key
        </button>
      </div>
    </div>
  );
}

function OnBoarding({
  setAuthHash,
  setAuthPreview,
}: {
  setAuthHash: (client: string | null) => void;
  setAuthPreview: (auth: string) => void;
}) {
  const [authLocal, setAuthLocal] = useState("");
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center">
          <h3 className="text-xl mb-5">Replace your OpenAI url</h3>
          <code className="bg-slate-800 p-1  px-3 text-md  text-slate-200">
            api.openai.com/v1
          </code>
          <ArrowDownIcon className="h-4" />
          <code className="bg-slate-800 py-1  px-3 text-md text-slate-200 ">
            oai.valyrai.com/v1
          </code>
          <i className="text-xs">
            <a href="https://github.com/bhunkio/app-ideas-valyr-demo/commit/d7443e5e6d2721a08863df82b34775e7e936ad30">
              example
            </a>
          </i>
        </div>
        <div className="border-[1px] border-slate-700 rounded-lg px-5 py-5 gap-3 flex flex-col items-center justify-between ">
          <h3 className="text-xl mb-5">Paste your OpenAI API key</h3>
          <div className="flex flex-col items-end">
            <input
              className="bg-slate-800 p-1  px-2"
              type="password"
              placeholder="Your OpenAI API key"
              onChange={(e) => {
                setAuthLocal(e.target.value);
              }}
            />
          </div>
          <button
            className="px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100"
            onClick={() => {
              setAuthPreview(middleTruncString(authLocal, 8));
              hashAuth(authLocal).then((hash) => setAuthHash(hash));
            }}
          >
            view dashboard
          </button>
          <i className="text-sm text-slate-600 dark:text-slate-300 flex flex-row items-center">
            your key is never stored on our servers
            <InformationCircleIcon className="h-5 mx-1" />
          </i>
        </div>
      </div>
      {/* Demo button */}
      <div className="flex flex-row justify-center items-center gap-4 mt-8">
        <button
          className="px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100"
          onClick={() => {
            setAuthHash(
              "1155382dfb904996467a32e42a28adf9cc0033b13874697d03527c09916a4bc7"
            );
            setAuthPreview("Demo...Demo");
          }}
        >
          Use demo API key
        </button>
      </div>
    </div>
  );
}
