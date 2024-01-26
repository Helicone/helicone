import PricingPage from "../components/templates/pricing/pricingPage";
import PublicMetaData from "../components/layout/public/publicMetaData";

const Pricing = () => {
  return (
    <>
      <PublicMetaData
        description={"Pricing as simple as our code integration."}
        ogImageUrl={"https://www.helicone.ai/static/helicone-pricing.png"}
      >
        <PricingPage />
      </PublicMetaData>
    </>
  );
};

export default Pricing;
