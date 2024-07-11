import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider, useUser } from "@supabase/auth-helpers-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";
import { ReactElement, ReactNode, useEffect, useState } from "react";
import Notification from "../components/shared/notification/Notification";
import { NotificationProvider } from "../components/shared/notification/NotificationContext";
import "../node_modules/react-grid-layout/css/styles.css";
import "../node_modules/react-resizable/css/styles.css";
import "../styles/globals.css";
import "../styles/index.css";

import { Analytics } from "@vercel/analytics/react";
import { NextPage } from "next";
import posthog from "posthog-js";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  OrgContextProvider,
  useOrg,
} from "../components/layout/organizationContext";
import { ThemeContextProvider } from "../components/shared/theme/themeContext";
import Script from "next/script";

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_POSTHOG_API_KEY &&
  process.env.NEXT_PUBLIC_ENDPOINT &&
  !process.env.NEXT_PUBLIC_DISABLE_POSTHOG
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
    api_host: "https://us.helicone.ai/ingest",
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

  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  const getLayout = Component.getLayout ?? ((page) => page);

  const trackingEnabled = process.env.NEXT_PUBLIC_TRACKING_ENABLED || false;

  const user = useUser();
  const org = useOrg();

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.name,
      });
    }

    if (org?.currentOrg) {
      posthog.group("organization", org.currentOrg.id, {
        name: org.currentOrg.name,
        tier: org.currentOrg.tier,
        stripe_customer_id: org.currentOrg.stripe_customer_id,
        organization_type: org.currentOrg.organization_type,
        size: org.currentOrg.size,
        date_joined: org.currentOrg.created_at,
      });
    }
  }, [user, org]);

  return (
    <>
      <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}
      >
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
      </SessionContextProvider>
      {trackingEnabled && <Analytics />}
      {trackingEnabled && (
        <Script
          id="koala-snippet"
          dangerouslySetInnerHTML={{
            __html: `!function(t){if(window.ko)return;window.ko=[],["identify","track","removeListeners","open","on","off","qualify","ready"].forEach(function(t){ko[t]=function(){var n=[].slice.call(arguments);return n.unshift(t),ko.push(n),ko}});var n=document.createElement("script");n.async=!0,n.setAttribute("src","https://cdn.getkoala.com/v1/pk_3d24ae9e69e18decfcb68b9d7b668c4501b5/sdk.js"),(document.body || document.head).appendChild(n)}();`,
          }}
        />
      )}
    </>
  );
}
