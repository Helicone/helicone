import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";
import { ReactElement, ReactNode, useState } from "react";
import Notification from "../components/shared/notification/Notification";
import { NotificationProvider } from "../components/shared/notification/NotificationContext";
import "../styles/globals.css";
import "../styles/index.css";
import "../node_modules/react-grid-layout/css/styles.css";
import "../node_modules/react-resizable/css/styles.css";
import posthog from "posthog-js";
import { OrgContextProvider } from "../components/layout/organizationContext";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ThemeContextProvider } from "../components/shared/theme/themeContext";
import { NextPage } from "next";

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_POSTHOG_API_KEY &&
  process.env.NEXT_PUBLIC_ENDPOINT &&
  !process.env.NEXT_PUBLIC_DISABLE_POSTHOG
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    api_host: "https://www.helicone.ai/ingest",
  });
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const queryClient = new QueryClient();
  const apolloClient = new ApolloClient({
    uri: `/api/graphql`,
    cache: new InMemoryCache(),
    credentials: "include",
    headers: {
      "use-cookies": "true",
    },
  });

  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  const getLayout = Component.getLayout ?? ((page) => page);
  const trackingEnabled = process.env.NEXT_PUBLIC_TRACKING_ENABLED || false;

  return (
    <>
      <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}
      >
        <ApolloProvider client={apolloClient}>
          <QueryClientProvider client={queryClient}>
            <NotificationProvider>
              <DndProvider backend={HTML5Backend}>
                <OrgContextProvider>
                  <ThemeContextProvider>
                    {getLayout(<Component {...pageProps} />)}
                  </ThemeContextProvider>
                  <Notification />
                </OrgContextProvider>
              </DndProvider>
            </NotificationProvider>
          </QueryClientProvider>
        </ApolloProvider>
      </SessionContextProvider>
    </>
  );
}
