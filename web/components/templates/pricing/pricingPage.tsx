import { Fragment, useState } from "react";
import { CheckCircleIcon, MinusIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import GridBackground from "../../layout/public/gridBackground";
import NavBarV2 from "../../layout/navbar/navBarV2";
import Footer from "../../layout/footer";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import ContactForm from "../../shared/contactForm";

const tiers = [
  {
    name: "Free",
    id: "tier-Free",
    href: "/signup",
    priceMonthly: "$0",
    text: "Try for free",
    description: "Everything necessary to get started",
    mostPopular: false,
  },
  {
    name: "Pro",
    id: "tier-Pro",
    href: "/signup",
    priceMonthly: "$80",
    text: "Get Started",
    description:
      "Everything in Free, plus essential tools for scaling up your business.",
    mostPopular: true,
  },
  {
    name: "Custom",
    id: "tier-Custom",
    href: "/sales",
    priceMonthly: "Enterprise",
    text: "Contact us",
    description:
      "Everything in Pro, plus features needed for larger enterprises.",
    mostPopular: false,
  },
];
const sections: {
  name: string;
  features: {
    name: string;
    tiers: Record<string, boolean | string>;
    href?: string;
  }[];
}[] = [
  {
    name: "Core Functionality",
    features: [
      {
        name: "Request Logs",
        tiers: {
          Free: "50,000 / mo",
          Pro: "500,000 / mo",
          Custom: "Unlimited",
        },
      },
      {
        name: "Dashboards",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "Request Labeling / Tagging",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "User Analytics",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "SOC-2 Compliance",
        tiers: { Custom: true },
      },
      {
        name: "Self-Deployment Management",
        tiers: { Custom: true },
      },
      {
        name: "Organization Seats",
        tiers: {
          Free: "3 seats",
          Pro: "8 seats",
          Custom: "Unlimited",
        },
      },
    ],
  },
  {
    name: "Features",
    features: [
      {
        name: "Prompts",
        tiers: {
          Free: "1",
          Pro: "3 + 20$/prompt (max 10)",
          Custom: "prompt bulk pricing",
        },
      },
      {
        name: "Prompt Evaluation",
        tiers: {
          Free: false,
          Pro: "limited access",
          Custom: true,
        },
      },
      {
        name: "Caching",
        tiers: {
          Free: false,
          Pro: "100mb",
          Custom: "Unlimited",
        },
      },
      {
        name: "User Rate Limiting",
        tiers: {
          Free: true,
          Pro: true,
          Custom: true,
        },
      },
      {
        name: "Request Retries",
        tiers: {
          Free: true,
          Pro: true,
          Custom: true,
        },
      },
      {
        name: "Fine-Tuning",
        tiers: {
          Free: "1 model",
          Pro: "10 models",
          Custom: "Unlimited",
        },
      },
      {
        name: "Model Load Balancing",
        tiers: {
          Free: false,
          Pro: "2 models",
          Custom: "Unlimited",
        },
      },
      {
        name: "Key Vault",
        tiers: {
          Free: false,
          Pro: "5 keys",
          Custom: "Unlimited keys",
        },
      },
      {
        name: "Webhooks",
        tiers: {
          Custom: true,
        },
      },
      {
        name: "Customer Portal",
        href: "sales?customer-portal=true",
        tiers: {
          Custom: true,
        },
      },
    ],
  },
  {
    name: "Exporting and Integrations",
    features: [
      {
        name: "CSV Export",
        tiers: { Free: true, Pro: true, Custom: true },
      },
      {
        name: "GraphQL API",
        tiers: { Free: false, Pro: "1,000 reqs / day", Custom: "Unlimited" },
      },
      {
        name: "Custom ETL Integrations",
        tiers: { Custom: true },
      },
    ],
  },
];

const MULTIPLIER = 1.8;

const pricingBands: {
  lower: number;
  upper: number;
  rate: number;
}[] = [
  {
    lower: 0,
    upper: 1_000_000,
    rate: 0,
  },
  {
    lower: 1_000_001,
    upper: 2_000_000,
    rate: 0.000248 * MULTIPLIER,
  },
  {
    lower: 2_000_001,
    upper: 15_000_000,
    rate: 0.000104 * MULTIPLIER,
  },
  {
    lower: 15_000_001,
    upper: 50_000_000,
    rate: 0.0000655 * MULTIPLIER,
  },
  {
    lower: 50_000_001,
    upper: 100_000_000,
    rate: 0.0000364 * MULTIPLIER,
  },
  {
    lower: 100_000_001,
    upper: 250_000_000,
    rate: 0.0000187 * MULTIPLIER,
  },
  {
    lower: 250_000_001,
    // infinite
    upper: Infinity,
    rate: 0.0000042 * MULTIPLIER,
  },
];

export default function Example() {
  const [requests, setRequests] = useState(0);

  const calculatePrice = (requests: number) => {
    // calculate the price using tax bands (if we are at 2,500,000 requests, we would use the 2,000,001 - 15,000,000 band and the 15,000,001 - 50,000,000 band to calculate the price and add them together.)
    let price = 0;
    let remainingRequests = requests;
    for (const band of pricingBands) {
      if (remainingRequests <= 0) {
        break;
      }
      const requestsInBand = Math.min(
        band.upper - band.lower,
        remainingRequests
      );
      price += requestsInBand * band.rate;
      remainingRequests -= requestsInBand;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="bg-white">
      <NavBarV2 />

      <div className="p-4 h-[40vh] w-[40vw] bg-white rounded-xl border border-gray-300 mx-auto">
        {/* create a slider that displays an estimated cost for different log bands */}

        <div className="flex flex-col items-center w-full">
          <h1 className="text-3xl font-bold">Estimated Cost</h1>
          <h2 className="text-xl font-semibold">Based on 1 month</h2>
          <div className="flex items-center flex-col w-full">
            <input
              type="range"
              min="0"
              max="100000000"
              step={500_000}
              value={requests}
              onChange={(e) => setRequests(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex items-center justify-between w-full">
              <p>0</p>
              <p>100_000_000</p>
            </div>
          </div>
          <p className="text-xl font-semibold">
            {requests.toLocaleString()} requests
          </p>
          <p className="text-xl font-semibold">
            {/* calcluate the price in the using the bands */}
            {calculatePrice(requests)} / month
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
