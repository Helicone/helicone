import PricingPage from "../components/templates/pricing/pricingPage";
import PublicMetaData from "../components/layout/public/publicMetaData";

const Pricing = () => {
  return (
    <>
      <PublicMetaData
        description={
          "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
        }
        ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
      >
        <PricingPage />
      </PublicMetaData>
    </>
  );
};

export default Pricing;
