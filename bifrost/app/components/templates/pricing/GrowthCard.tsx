import { useState } from "react";
import BaseCard from "./BaseCard";
import Slider from "./Slider";
import { renderLogCost } from "@/app/utils/pricingUtils";

const GrowthCard: React.FC = () => {
  const [requestLogs, setRequestLogs] = useState(0);

  const handleRequestLogChange = (newValue: number) => {
    setRequestLogs(newValue);
  };

  const features = [
    { name: "Observability and Analytics", included: true },
    { name: "10,000 requests", included: true },
    { name: "Core Tooling", included: true },
    { name: "1 month retention", included: true },
    { name: "No credit card required", included: true },
    { name: "Prompts", included: false },
    { name: "Experiments", included: false },
    { name: "Playground", included: false },
    { name: "Cache Stats", included: false },
    { name: "Rate Limit Stats", included: false },
    { name: "API Access", included: false },
    { name: "Evals", included: false },
    { name: "Connections", included: false },
    { name: "SOC-2 Compliance", included: false },
    { name: "On-Prem Deployment", included: false },
  ];

  return (
    <BaseCard
      name="Growth"
      description="Free for up to 10k requests per month"
      price={
        <>
          <p className="text-3xl font-semibold">{renderLogCost(requestLogs)}</p>
          <p className="text-sm text-gray-500">/month</p>
        </>
      }
      features={features}
      ctaText="Start building for free"
      ctaLink="https://us.helicone.ai/signup"
      ctaClassName="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 w-full flex items-center justify-center gap-2"
    >
      <div className="h-32 border-t border-b border-gray-100 flex items-center w-full">
        <div className="py-4 w-full">
          <p className="text-xs text-black font-semibold">
            {new Intl.NumberFormat("us", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(requestLogs)}
            <span className="text-gray-500 font-normal"> requests / month</span>
          </p>
          <Slider
            min={0}
            max={50_000_000}
            exponent={3}
            onChange={handleRequestLogChange}
            labels={{
              0: "0",
              100_000: "100k",
              1_000_000: "1m",
              10_000_000: "10m",
              50_000_000: "50m",
            }}
          />
        </div>
      </div>
    </BaseCard>
  );
};

export default GrowthCard;
