import PublicMetaData from "../components/layout/public/publicMetaData";
import InvalidPage from "../components/shared/errors/invalid";

const ErrorPage = () => {
  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      <InvalidPage />
    </PublicMetaData>
  );
};

export default ErrorPage;
