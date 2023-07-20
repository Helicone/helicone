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
    // All downhill since demo day (https://helicone.ai/stats)
    const daysSinceDemoDay = Math.floor(
      (new Date().getTime() - new Date("2023-04-06").getTime()) /
        (1000 * 3600 * 24)
    );
    const newOpacity = 1 - daysSinceDemoDay * 0.005;
    const basedOpacity = newOpacity < 0.05 ? 5 : newOpacity;

    return (
      <Html className="h-full bg-gray-100" style={{ opacity: basedOpacity }}>
        <Head />
        <body className="h-full">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
