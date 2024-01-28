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
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              !(function (t) {
                if (window.ko) return;
                (window.ko = []),
                  [
                    "identify",
                    "track",
                    "removeListeners",
                    "open",
                    "on",
                    "off",
                    "qualify",
                    "ready",
                  ].forEach(function (t) {
                    ko[t] = function () {
                      var n = [].slice.call(arguments);
                      return n.unshift(t), ko.push(n), ko;
                    };
                  });
                var n = document.createElement("script");
                (n.async = !0),
                  n.setAttribute(
                    "src",
                    "https://cdn.getkoala.com/v1/pk_2cde028c10d7604aa59914bf2b0473ee83c7/sdk.js"
                  ),
                  (document.body || document.head).appendChild(n);
              })();
            `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
