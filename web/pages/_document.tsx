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
