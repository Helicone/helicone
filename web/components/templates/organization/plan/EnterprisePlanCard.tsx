import { Col } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { PlanFeatureCard } from "./PlanFeatureCard";

export const EnterprisePlanCard = () => {
  return (
    <div className="flex gap-6 lg:flex-row flex-col">
      <Card className="max-w-3xl w-full h-fit">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-end">
            Enterprise{" "}
            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-md ml-2 font-medium">
              Current plan
            </span>
          </CardTitle>
          <CardDescription>
            Your custom Enterprise plan tailored for your organization{"'"}s
            needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Col className="gap-4">
            <p className="text-sm text-gray-500">
              For detailed information about your Enterprise plan, including
              custom features, limits, and support options, please contact your
              account manager.
            </p>
            <Link href="mailto:enterprise-support@helicone.ai">
              <Button variant="outline">Contact Enterprise Support</Button>
            </Link>
          </Col>
        </CardContent>
      </Card>

      <div className="space-y-6 w-full lg:w-[450px]">
        <PlanFeatureCard
          title="Need to adjust your plan?"
          description="We're here to help you optimize your Enterprise plan for your evolving needs."
          buttonText="Schedule a Call"
          onClick={() =>
            window.open(
              "https://cal.com/team/helicone/helicone-discovery",
              "_blank"
            )
          }
        />

        <PlanFeatureCard
          title="Looking for documentation?"
          description="Access our comprehensive Enterprise documentation and guides."
          buttonText="View Enterprise Docs"
          onClick={() =>
            window.open(
              "https://docs.helicone.ai/advanced-usage/enterprise-features",
              "_blank"
            )
          }
        />
      </div>
    </div>
  );
};
