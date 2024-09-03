import { useState } from "react";
import BaseCard from "./BaseCard";
import Slider from "./Slider";
import { renderLogCost } from "@/app/utils/pricingUtils";
import { Col } from "@/components/common/col";
import { Button } from "@/components/ui/button";

import { Switch } from "@/components/ui/switch";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ScaleCard: React.FC = () => {
  const [requestLogs, setRequestLogs] = useState(0);
  const [promptCount, setPromptCount] = useState(0);

  const handleRequestLogChange = (newValue: number) => {
    setRequestLogs(newValue);
  };

  const handlePromptCountChange = (newValue: number) => {
    setPromptCount(newValue);
  };

  const calculatePromptCost = (count: number) => {
    if (count <= 3) return 0;
    return (count - 3) * 25;
  };

  const features = [
    { name: "Observability and Analytics", included: true },
    { name: "Feature-Rich Tooling", included: true },
    { name: "Prompt Templates", included: true },
    { name: "Prompt Experiments", included: true },
    { name: "SOC-2 Compliance", included: false },
    { name: "On-Prem Deployment", included: false },
  ];

  const totalCost =
    parseFloat(renderLogCost(requestLogs).replace(/[^0-9.-]+/g, "")) +
    calculatePromptCost(promptCount);

  return (
    <BaseCard
      name="Scale"
      price={
        <>
          <p className="text-3xl font-semibold">${totalCost.toFixed(2)}</p>
          <p className="text-sm text-gray-500">/month</p>
        </>
      }
      features={features}
      ctaText="Get started for free"
      ctaLink="https://us.helicone.ai/signup"
    >
      <div className="space-y-4 border-t border-b border-gray-100 py-4">
        <Col>
          <h3 className="text-5xl font-semibold">Scale</h3>
          <Switch />
          <p>Enable scaling</p>
        </Col>
        <div>
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

        <div>
          <p className="text-xs text-black font-semibold">
            {promptCount}{" "}
            <span className="text-gray-500 font-normal">prompts</span>
          </p>
          <Slider
            min={0}
            max={100}
            exponent={1}
            onChange={handlePromptCountChange}
            labels={{
              0: "0",
              25: "25",
              50: "50",
              75: "75",
              100: "100",
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            First 3 prompts free, then $25/prompt
          </p>
        </div>
      </div>
    </BaseCard>
  );
};

export default ScaleCard;
