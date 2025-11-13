import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from "next/document";
import { Toaster } from "@/components/ui/sonner";

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    const pathname = this.props.__NEXT_DATA__.page;
    const isOpenStatsPage = pathname === "/open-stats";

    return (
      <Html className={isOpenStatsPage ? "open-stats-html" : ""}>
        <Head>
          {/* eslint-disable-next-line @next/next/no-sync-scripts */}
          <script src="/__ENV.js" />
          {/* Google tag (gtag.js) */}
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-WGDEGPP49F"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-WGDEGPP49F');
              `,
            }}
          />
        </Head>
        <body className={isOpenStatsPage ? "open-stats-body" : ""}>
          <Main />
          <Toaster />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
