import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";
import { ReactElement, ReactNode, useState } from "react";
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
import { OrgContextProvider } from "../components/layout/organizationContext";
import { ThemeContextProvider } from "../components/shared/theme/themeContext";
import Script from "next/script";
import { PostHogProvider } from "posthog-js/react";

declare global {
  interface Window {
    pylon?: any;
  }
}

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

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const queryClient = new QueryClient();

  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  const getLayout = Component.getLayout ?? ((page) => page);

  const trackingEnabled = process.env.NEXT_PUBLIC_TRACKING_ENABLED || false;

  return (
    <>
      <PHProvider>
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
      </PHProvider>
      {trackingEnabled && <Analytics />}
      {trackingEnabled && (
        <Script
          id="koala-snippet"
          dangerouslySetInnerHTML={{
            __html: `!function(t){if(window.ko)return;window.ko=[],["identify","track","removeListeners","open","on","off","qualify","ready"].forEach(function(t){ko[t]=function(){var n=[].slice.call(arguments);return n.unshift(t),ko.push(n),ko}});var n=document.createElement("script");n.async=!0,n.setAttribute("src","https://cdn.getkoala.com/v1/pk_3d24ae9e69e18decfcb68b9d7b668c4501b5/sdk.js"),(document.body || document.head).appendChild(n)}();`,
          }}
        />
      )}
      {trackingEnabled && (
        <Script
          id="pylon-snippet"
          dangerouslySetInnerHTML={{
            __html: `(function(){var e=window;var t=document;var n=function(){n.e(arguments)};n.q=[];n.e=function(e){n.q.push(e)};e.Pylon=n;var r=function(){var e=t.createElement("script");e.setAttribute("type","text/javascript");e.setAttribute("async","true");e.setAttribute("src","https://widget.usepylon.com/widget/f766dfd3-28f8-40a8-872f-351274cbd306");var n=t.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};if(t.readyState==="complete"){r()}else if(e.addEventListener){e.addEventListener("load",r,false)}})();`,
          }}
        />
      )}
    </>
  );
}
