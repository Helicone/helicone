import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import {
  ArrowDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
export default function Home() {
  const [client, setClient] = useState<SupabaseClient | null>(null);

  return (
    <div className="h-screen flex flex-col">
      <Head>
        <title>Valyr better logging for OpenAI</title>
        <meta name="description" content="Valyr" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-1 flex-col justify-center items-center gap-8">
        <h1 className="text-6xl">Welcome to Valyr 🛡</h1>
        <div className="grid grid-cols-2 gap-8">
          <div className="border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center">
            <h3 className="text-xl mb-5">Replace your OpenAI url</h3>
            <code className="bg-slate-800 p-1 text-md">api.openai.com/v1</code>
            <ArrowDownIcon className="h-4" />
            <code className="bg-slate-800 p-1 text-md">oai.valyrai.com/v1</code>
          </div>
          <div className="border-[1px] border-slate-700 rounded-lg px-5 py-3 flex flex-col items-center justify-between">
            <h3 className="text-xl mb-5">Add your OpenAI API key</h3>
            <div className="flex flex-col items-end">
              <input
                className="bg-slate-800 p-1"
                placeholder="Your OpenAI API key"
              />
              <button className="text-sm text-slate-300">demo</button>
            </div>
            <i className="text-sm text-slate-300 flex flex-row items-center">
              your key is never stored on our servers
              <InformationCircleIcon className="h-5 mx-1" />
            </i>
          </div>
        </div>
        <div className={styles.grid}>hello</div>
      </main>

      <footer className="h-12 text-center border-t-2 border-slate-800">
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
