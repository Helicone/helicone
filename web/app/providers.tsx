"use client";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Session, SessionContextProvider } from "@supabase/auth-helpers-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NotificationProvider } from "../components/shared/notification/NotificationContext";
import "../node_modules/react-grid-layout/css/styles.css";
import "../node_modules/react-resizable/css/styles.css";
import "../styles/globals.css";
import "../styles/index.css";
import posthog from "posthog-js";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { OrgContextProvider } from "../components/layout/org/organizationContext";
import ThemeProvider from "../components/shared/theme/themeContext";
import { PostHogProvider } from "posthog-js/react";
import { env } from "next-runtime-env";
import { FilterProvider } from "@/filterAST/context/filterContext";
import Notification from "@/components/shared/notification/Notification";


declare global {
  interface Window {
    pylon?: any;
    Pylon?: any;
  }
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_POSTHOG_API_KEY &&
    process.env.NEXT_PUBLIC_ENDPOINT &&
    !process.env.NEXT_PUBLIC_DISABLE_POSTHOG
  ) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      api_host: `${window.location.protocol}//${window.location.host}/ingest`,
    });
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

export function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const [supabaseClient] = useState(() => {
    if (
      env("NEXT_PUBLIC_SUPABASE_URL") &&
      env("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    ) {
      return createBrowserSupabaseClient({
        supabaseUrl: env("NEXT_PUBLIC_SUPABASE_URL"),
        supabaseKey: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      });
    }
    return null;
  });

  if (!supabaseClient) {
    return <>{children}</>;
  }

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}


export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PHProvider>
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <DndProvider backend={HTML5Backend}>
              <OrgContextProvider>
                <FilterProvider>
                  <ThemeProvider>
                    {children}
                  </ThemeProvider>
                </FilterProvider>
                <Notification />
              </OrgContextProvider>
            </DndProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </SupabaseProvider>
    </PHProvider>
  )
}
