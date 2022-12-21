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
import { hashAuth, supabaseClientAuthHash } from "../lib/supabaseClient";
import { DateMetrics } from "../components/timeGraph";
import { Logo } from "../components/logo";
import { RequestTable } from "../components/requestTable";
import { MetricsPanel } from "../components/metricsPanel";
import { Logs } from "../components/logPanel";

import Step from "../components/common/step";
import Image from "next/image";
import { middleTruncString } from "../lib/stringHelpers";
import { UserTable } from "../components/userTable";

import {
  User,
  createServerSupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "../supabase/database.types";

import { GetServerSidePropsContext } from "next";
import { useKeys } from "../lib/useKeys";
import Link from "next/link";
import { useRouter } from "next/router";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx);
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  return {
    props: {},
  };
};

export default function LoggedInFlow() {
  const user = useUser();

  return (
    <div className="flex flex-col h-full px-10 pb-12">
      {user?.email === "valyrdemo@gmail.com" && (
        <div className="flex flex-row items-center justify-center bg-red-500 text-white p-2 mb-5">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <p className="text-sm">
            You are currently logged in as a demo user. All of the traffic for
            this user is coming from this demo site{" "}
            <Link
              href="https://demoapp.valyrai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              AI App Ideas
            </Link>{" "}
            .
          </p>
        </div>
      )}
      <div className="h-2/6 w-full ">
        <div className="flex flex-col md:flex-row gap-8 ">
          <div className="flex-1 border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center">
            <MetricsPanel />
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
              <Logs />
            </div>
          </div>
        </div>
      </div>
      <div className="h-3/6 w-full ">
        <GraphAndCharts />
      </div>
    </div>
  );
}

function GraphAndCharts() {
  type View = "Graph" | "Requests" | "Users";

  const [currentView, setCurrentView] = useState<View>("Graph");
  const client = useSupabaseClient();

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
      <div className="h-[10%] w-full md:pl-10 flex flex-col gap-3 mt-4">
        <div className="flex flex-row gap-5 items-center  overflow-auto">
          <div className="border-2 dark:border-none rounded-full grid grid-cols-2 sm:grid-cols-3 gap-2">
            {differentViews.map((view) => (
              <div
                className={
                  "items-center px-8 text-center rounded-full py-1 cursor-pointer " +
                  (view.name === currentView
                    ? "dark:bg-slate-500 bg-slate-500"
                    : "dark:bg-slate-800 ")
                }
                onClick={() => setCurrentView(view.name)}
                key={view.name}
              >
                <p
                  className={
                    view.name === currentView
                      ? "dark:text-slate-200 text-slate-100"
                      : "dark:text-slate-100 "
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
      <div className="w-full h-72">
        <DateMetrics client={client} />
      </div>
    </div>
  );
}
