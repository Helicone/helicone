import {
  ArrowDownIcon,
  ArrowUpIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { SupabaseClient } from "@supabase/supabase-js";
import Head from "next/head";
import { useEffect, useState } from "react";
import { hashAuth } from "../lib/supabaseClient";
import { DateMetrics } from "../components/timeGraph";
import { Logo } from "../components/logo";
import { RequestTable } from "../components/requestTable";
import { MetricsPanel } from "../components/metricsPanel";
import { Logs } from "../components/logPanel";

import Step from "../components/common/step";
import Image from "next/image";
import { middleTruncString } from "../lib/stringHelpers";
import { UserTable } from "../components/userTable";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "../supabase/database.types";
import { useRouter } from "next/router";
import { useKeys } from "../lib/useKeys";
import Link from "next/link";

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
  const router = useRouter();

  const supabaseClient = useSupabaseClient<Database>();

  const apiKeys = useKeys(supabaseClient);

  return (
    <div className="flex flex-col">
      <Head>
        <title>Valyr better logging for OpenAI</title>
        <meta name="description" content="Valyr" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="items-center pt-5 pb-12 ">
        <div className="flex flex-col md:items-center p-4 md:p-0 items-center">
          <div className="my-8 mt-8 sm:mt-36">
            <div className="hidden md:flex md:flex-row gap-5 items-center">
              <div className="hidden md:block font-light text-6xl">
                Welcome to{" "}
                <span className="font-semibold bg-gray-700 py-2 px-4 rounded-lg">
                  VALYR
                </span>
              </div>
            </div>
            <div className="md:hidden flex flex-col text-center text-5xl md:text-6xl">
              Welcome to
              <div className="font-semibold bg-gray-700 py-1 px-2 rounded-lg mt-2 m-auto">
                VALYR
              </div>
            </div>
          </div>
          <div className="font-extralight text-3xl mb-8 text-center">
            Simplify GPT-3 monitoring with{" "}
            <span className="font-semibold">one</span> line of code
          </div>
          <button
            onClick={() => {
              supabaseClient.auth.signOut().then(() => {
                supabaseClient.auth
                  .signInWithPassword({
                    email: "valyrdemo@gmail.com",
                    password: "valyrdemo",
                  })
                  .then((res) => {
                    console.log(res);
                    router.push("/dashboard");
                  });
              });
            }}
            className="max-w-md items-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-white hover:bg-slate-600 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-16"
          >
            View Demo
          </button>
          <div className="flex flex-col lg:flex-row gap-12 md:gap-8 ">
            <Step stepNumber={1} label="Replace <base url, SDK>">
              <div
                className="flex flex-row"
                style={{ backgroundColor: "rgba(229, 83, 75, 0.15)" }}
              >
                <MinusIcon className="h-4 mt-3 mx-2" />
                <code
                  className="py-2 px-4 text-md  text-slate-200"
                  style={{ backgroundColor: "rgba(229, 83, 75, 0.15)" }}
                >
                  <span
                    className="p-1 rounded-md"
                    style={{ backgroundColor: "rgba(229,83,75,0.4)" }}
                  >
                    api.openai
                  </span>
                  .com/v1
                </code>
              </div>

              <ArrowDownIcon className="h-4 my-2" />
              <div
                className="flex flex-row"
                style={{ backgroundColor: "rgba(70,149,74,0.15)" }}
              >
                <PlusIcon className="h-4 mt-3 mx-2" />
                <code
                  className="py-2 px-4 text-md  text-slate-200"
                  style={{ backgroundColor: "rgba(70,149,74,0.15)" }}
                >
                  <span
                    className="p-1 rounded-md"
                    style={{ backgroundColor: "rgba(70,149,74,0.4)" }}
                  >
                    oai.valyrai
                  </span>
                  .com/v1
                </code>
              </div>
            </Step>
            <Step stepNumber={2} label="Add OpenAI key to Valyr account">
              <Step2 apiKeys={apiKeys} />
            </Step>
            <Step stepNumber={3} label="View requests in dashboard">
              <Image
                src="/assets/demo-dashboard.png"
                alt="Dashboard Image"
                width={250}
                height={250}
              />
              <button
                disabled={apiKeys.length <= 0}
                onClick={() => {
                  router.push("/dashboard");
                }}
                className={`items-center rounded-md border border-slate-700 ${
                  apiKeys.length <= 0
                    ? "bg-slate-400 hover:cursor-not-allowed opacity-50"
                    : "bg-slate-800 hover:cursor-pointer hover:bg-slate-600"
                } px-4 py-2 text-white focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-2`}
              >
                View Dashboard
              </button>
            </Step>
          </div>
        </div>
      </main>
    </div>
  );
}

function Step2({
  apiKeys,
}: {
  apiKeys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}) {
  const user = useUser();

  const supabaseClient = useSupabaseClient<Database>();
  const [showInfo, setShowInfo] = useState(false);
  const [apiKey, setApiKey] = useState("");

  async function addKey() {
    if (!user?.id) {
      alert("Please login to add a key");
      return;
    }
    setApiKey("");
    supabaseClient
      .from("user_api_keys")
      .insert([
        {
          user_id: user?.id!,
          api_key_hash: await hashAuth(apiKey),
          api_key_preview: middleTruncString(apiKey, 8),
        },
      ])
      .then((res) => {
        if (res.error) {
          console.error(res.error);
          alert("Error saving key - please contact us on discord");
        }
      });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <div>
          {!user ? (
            <div className="flex flex-row gap-1">
              <a href="login" className="text-indigo-400" target="_blank">
                Login
              </a>
              <a>to enter key</a>
            </div>
          ) : (
            <div className="flex flex-row gap-1">
              <a>
                You have{" "}
                <Link href="/settings/keys" className="text-indigo-400">
                  {apiKeys.length} key
                  {apiKeys.length === 1 ? "" : "s"}
                </Link>
                , view
                <Link className="text-indigo-400" href="/dashboard">
                  {" "}
                  dashboard
                </Link>
                .
              </a>
              <a></a>
            </div>
          )}
        </div>

        <div className="flex flex-row items-end gap-2">
          <input
            className="bg-slate-800 py-2 px-4 rounded-md"
            type="password"
            placeholder="Your OpenAI API key"
            value={apiKey}
            disabled={!user}
            onChange={(e) => {
              setApiKey(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addKey();
              }
            }}
          />
          <button
            disabled={!user}
            onClick={() => {
              addKey();
            }}
            className={`items-center rounded-md border border-slate-700 ${
              apiKey === ""
                ? "bg-slate-400 hover:cursor-not-allowed opacity-50"
                : "bg-slate-800 hover:cursor-pointer hover:bg-slate-600"
            } px-4 py-2 text-white focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-2`}
          >
            Add
          </button>
        </div>
      </div>
      <i
        className="text-sm text-slate-600 dark:text-slate-300 flex flex-row items-center hover:cursor-pointer"
        onClick={() => {
          setShowInfo(!showInfo);
        }}
      >
        your key is never stored on our servers
        <InformationCircleIcon className="h-5 mx-1" />
      </i>
      {showInfo && (
        <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-2 mt-2">
          <p>
            We log each request to our API using a hashed version of your API
            key. This allows us to identify your account without storing your
            API key.
          </p>
          <p>
            When you paste your API key into the input above, we hash it using
            the same algorithm we use to log requests.
          </p>
        </div>
      )}
    </div>
  );
}
