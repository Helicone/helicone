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
    <div className="flex flex-col gap-6 lg:flex-row">
      <Card className="h-fit w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-end text-lg font-medium">
            Enterprise{" "}
            <span className="ml-2 rounded-md bg-purple-100 px-2 py-1 text-sm font-medium text-purple-700">
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

      <div className="w-full space-y-6 lg:w-[450px]">
        <PlanFeatureCard
          title="Need to adjust your plan?"
          description="We're here to help you optimize your Enterprise plan for your evolving needs."
          buttonText="Schedule a Call"
        />

        <PlanFeatureCard
          title="Looking for documentation?"
          description="Access our comprehensive Enterprise documentation and guides."
          buttonText="View Enterprise Docs"
        />
      </div>
    </div>
  );
};
