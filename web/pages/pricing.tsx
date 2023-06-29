import MetaData from "../components/shared/metaData";
import PricingPage from "../components/templates/pricing/pricingPage";

interface PricingProps {}

const Pricing = (props: PricingProps) => {
  const {} = props;

  return (
    <MetaData title="Pricing">
      <PricingPage />
    </MetaData>
  );
};

export default Pricing;
