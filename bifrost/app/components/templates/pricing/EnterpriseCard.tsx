import BaseCard from "./BaseCard";

const EnterpriseCard: React.FC = () => {
  const features = [
    { name: "Observability and Analytics", included: true },
    { name: "Feature-Rich Tooling", included: true },
    { name: "Prompt Templates", included: true },
    { name: "Prompt Experiments", included: true },
    { name: "SOC-2 Compliance", included: true },
    { name: "On-Prem Deployment", included: true },
  ];

  return (
    <BaseCard
      name="Enterprise"
      description="Contact us for a tailored plan for your business"
      price={<p className="text-3xl font-semibold">Get in touch</p>}
      features={features}
      ctaText="Get in touch"
      ctaLink="/contact"
    />
  );
};

export default EnterpriseCard;
