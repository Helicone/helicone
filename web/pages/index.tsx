import {
  ArrowDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { SupabaseClient } from "@supabase/supabase-js";
import Head from "next/head";
import { useEffect, useState } from "react";

import { supabaseClient } from "../lib/supabaseClient";
import { DateMetrics } from "./timeGraph";

export default function Home() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  useEffect(() => {
    supabaseClient("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").then(
      (client) => {
        setClient(client);
      }
    );
  }, []);

  return (
    <div className="flex flex-col">
      <Head>
        <title>Valyr better logging for OpenAI</title>
        <meta name="description" content="Valyr" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-1 flex-col justify-center items-center gap-8 mt-10 mb-12">
        <h1 className="text-6xl text-center">Welcome to Valyr 🛡</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center">
            <h3 className="text-xl mb-5">Replace your OpenAI url</h3>
            <code className="bg-slate-800 p-1 text-md">api.openai.com/v1</code>
            <ArrowDownIcon className="h-4" />
            <code className="bg-slate-800 p-1 text-md">oai.valyrai.com/v1</code>
          </div>
          <div className="border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center justify-between">
            <h3 className="text-xl mb-5">Paste your OpenAI API key</h3>
            <div className="flex flex-col items-end">
              <input
                className="bg-slate-800 p-1"
                type="password"
                placeholder="Your OpenAI API key"
                onChange={(e) => {
                  supabaseClient(e.target.value).then((client) => {
                    setClient(client);
                  });
                }}
              />
              <button className="text-sm text-slate-300">demo</button>
            </div>
            <i className="text-sm text-slate-300 flex flex-row items-center">
              your key is never stored on our servers
              <InformationCircleIcon className="h-5 mx-1" />
            </i>
          </div>
        </div>
        <div className="h-full w-full px-12">
          {client !== null ? (
            <>
              <div className="h-2/5 w-full">
                <div className="h-1/6 w-full px-10 text-gray-500 animate-pulse">
                  Listening for updates...
                </div>
                <div className="w-full h-52">
                  <DateMetrics client={client} />
                </div>
              </div>
              <div className="h-3/5 w-full overflow-y-scroll"></div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col justify-center items-center">
              Put in an API key to see your usage metrics
            </div>
          )}
        </div>
        <div className="h-40 w-8 border-2"></div>
      </main>

      <footer className="fixed left-0 bottom-0 z-20 h-12 w-full text-center border-t-2 border-slate-800 bg-black bg-opacity-90">
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Footer things go here
        </a>
      </footer>
    </div>
  );
}
