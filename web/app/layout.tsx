import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { Inter } from "next/font/google";
import "../node_modules/react-grid-layout/css/styles.css";
import "../node_modules/react-resizable/css/styles.css";
import "../styles/globals.css";
import "../styles/index.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode,
  params: any;
}) {
  const trackingEnabled = process.env.NEXT_PUBLIC_TRACKING_ENABLED === "true";

  const pathname = params?.pathname || "";
  const isOpenStatsPage = pathname === "/open-stats"

  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <Script src="/__ENV.js" strategy="beforeInteractive" />
      </head>
      <body className={isOpenStatsPage ? "open-stats-body" : ""}>
        <Providers>
          <div className={inter.className}>
            {children}
          </div>
        </Providers>
        
        
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
        {trackingEnabled && (
          <Script
            id="rb2b-snippet"
            dangerouslySetInnerHTML={{
              __html: `!function(){var reb2b=window.reb2b=window.reb2b||[];if(reb2b.invoked)return;reb2b.invoked=true;reb2b.methods=["identify","collect"];reb2b.factory=function(method){return function(){var args=Array.prototype.slice.call(arguments);args.unshift(method);reb2b.push(args);return reb2b;}};for(var i=0;i<reb2b.methods.length;i++){var key=reb2b.methods[i];reb2b[key]=reb2b.factory(key);}reb2b.load=function(key){var script=document.createElement("script");script.type="text/javascript";script.async=true;script.src="https://s3-us-west-2.amazonaws.com/b2bjsstore/b/"+key+"/LNKLDHM4VMOJ.js.gz";var first=document.getElementsByTagName("script")[0];first.parentNode.insertBefore(script,first);};reb2b.SNIPPET_VERSION="1.0.1";reb2b.load("LNKLDHM4VMOJ");}();`,
            }}
          />
        )}
        <Toaster />
      </body>
    </html>
  )
}
