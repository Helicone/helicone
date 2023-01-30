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
        <Component {...pageProps} />
      </SessionContextProvider>
      <Analytics />
    </>
  );
}
