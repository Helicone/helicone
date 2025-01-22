import { CheckIcon } from "lucide-react";
import { UpgradeToProCTA } from "./upgradeToProCTA";
import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const PricingCompare = ({
  featureName = "",
}: {
  featureName: string;
}) => {
  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        The Free plan only comes with 10,000 requests per month, but getting
        more is easy.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Free</h3>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            Current plan
          </span>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              10k free requests/month
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Access to Dashboard
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Free, truly
            </li>
          </ul>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Pro</h3>
          <span className="text-sm">$20/user</span>
          <p className="text-sm mt-2">Everything in Free, plus:</p>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Limitless requests (first 100k free)
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Access to all features
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Standard support
            </li>
          </ul>
          <a href="#" className="text-sm text-blue-600 mt-2 block">
            See all features →
          </a>
          <UpgradeToProCTA
            defaultPrompts={featureName === "Prompts"}
            showAddons={featureName === "Prompts"}
          />
        </div>
      </div>
      <div className="border rounded-lg p-4 mt-2">
        <Row className="flex items-center justify-between">
          <Col>
            <h3 className="font-semibold mb-2">Let&apos;s talk</h3>
            <p className="text-sm">
              Contact us with any questions or to get more features.
            </p>
          </Col>
          <Button asChild>
            <Link
              href="https://cal.com/team/helicone/helicone-discovery"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact us
            </Link>
          </Button>
        </Row>
      </div>
    </>
  );
};
