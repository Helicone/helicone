import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session, SessionContextProvider } from "@supabase/auth-helpers-react";
import { AppProps } from "next/app";
import { useState } from "react";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { NotificationProvider } from "../components/shared/notification/NotificationContext";
import Notification from "../components/shared/notification/Notification";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import posthog from "posthog-js";

if (typeof window !== "undefined") {
  posthog.init("phc_jeluwNoJNpc7zEzkQrPbjyMOqdnJQjFAVr849LaEaPG", {
    api_host: "https://e.helicone.ai",
  });
}

export default function MyApp({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session;
}>) {
  const queryClient = new QueryClient();

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
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <Component {...pageProps} />
            <Notification />
          </NotificationProvider>
        </QueryClientProvider>
      </SessionContextProvider>
      <Analytics />
    </>
  );
}
