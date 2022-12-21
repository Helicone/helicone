import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  Session,
  SessionContextProvider,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { AppProps } from "next/app";
import { useState } from "react";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { useRouter } from "next/router";
import NavBar from "../components/shared/navBar";

export default function MyApp({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session;
}>) {
  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  if (typeof window !== "undefined") {
    document.documentElement.classList.add("dark");
  }
  return (
    <>
      <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}
      >
        <div className="bg-black text-gray-100 min-h-screen h-full flex flex-col overflow-auto">
          <div className="fixed left-0 top-0 -z-20 bg-black w-full h-screen"></div>
          <NavBar />

          <div className="pb-20">
            <Component {...pageProps} />
          </div>
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
      </SessionContextProvider>
      <Analytics />
    </>
  );
}
