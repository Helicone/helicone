import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from "next/document";

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
        <Head />
        {/* <Head>
          <script src="https://unpkg.com/react-scan/dist/auto.global.js"></script>
        </Head> */}
        <body className={isOpenStatsPage ? "open-stats-body" : ""}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
