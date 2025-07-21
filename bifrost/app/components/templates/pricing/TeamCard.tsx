import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeatureItem } from "./FeaturedItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TeamCard: React.FC = () => {
  return (
    <Card className="bg-background border-border mx-auto h-full w-full border-spacing-1.5 rounded-xl p-6 md:border-transparent md:shadow-none">
      <Col className="h-full justify-between gap-6">
        <Col className="gap-6">
          <Col className="h-full gap-2">
            <Row className="items-center justify-between">
              <div className="text-accent-foreground text-md font-semibold leading-tight">
                Team
              </div>
              <Badge variant="secondary">BEST VALUE</Badge>
            </Row>
            <Row className="items-center gap-0.5">
              <div className="text-accent-foreground text-3xl font-bold">
                $200
              </div>
              <div className="text-accent-foreground text-lg font-semibold">
                per month
              </div>
            </Row>
            <div className="text-sidebar-foreground text-sm font-normal">
              For growing companies.
            </div>
          </Col>

          <Col>
            {[
              "Everything in Pro",
              "Unlimited seats",
              "Prompt Management",
              "SOC-2 & HIPAA compliance",
              "Dedicated Slack channel",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 py-1.5">
                <div className="relative h-4 w-4 overflow-hidden">
                  <Check className="h-full w-full" />
                </div>
                <div className="text-sidebar-foreground text-sm font-normal">
                  {feature}
                </div>
              </div>
            ))}
          </Col>
        </Col>

        <Link href="https://us.helicone.ai/settings/billing">
          <Button variant="secondary" className="w-full py-5 text-base">
            7-day free trial
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default TeamCard;
