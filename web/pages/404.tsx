import PublicMetaData from "../components/layout/public/publicMetaData";
import InvalidPage from "../components/shared/errors/invalid";

const ErrorPage = () => {
  return (
    <PublicMetaData
      description={"Page not found"}
      ogImageUrl={"https://www.helicone.ai/static/helicone-landing.png"}
    >
      <InvalidPage />
    </PublicMetaData>
  );
};

export default ErrorPage;
