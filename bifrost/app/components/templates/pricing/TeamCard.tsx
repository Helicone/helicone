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
    <Card className="w-full h-full p-6 bg-background rounded-xl border-spacing-1.5 border-border md:border-transparent md:shadow-none mx-auto">
      <Col className="h-full justify-between gap-6">
        <Col className="gap-6">

          <Col className="h-full gap-2">
            <Row className="justify-between items-center">
              <div className="text-accent-foreground text-md font-semibold leading-tight">
                Team
              </div>
              <Badge variant="secondary">BEST VALUE</Badge>
            </Row>
            <Row className="items-center gap-0.5">
              <div className="text-accent-foreground text-3xl font-bold">$799</div>
              <div className="text-accent-foreground text-lg font-semibold">
                per month
              </div>
            </Row>
            <div className="text-sidebar-foreground text-sm font-normal">
              For scaling companies.
            </div>
          </Col>

          <Col>
            {[
              "Everything in Pro",
              "5 organizations",
              "SOC-2 & HIPAA compliance",
              "Dedicated Slack channel",
              "Support engineer & SLAs",
            ].map((feature, index) => (
              <div key={index} className="py-1.5 flex items-center gap-2">
                <div className="w-4 h-4 relative overflow-hidden">
                  <Check className="w-full h-full" />
                </div>
                <div className="text-sidebar-foreground text-sm font-normal">
                  {feature}
                </div>
              </div>
            ))}
          </Col>
        </Col>

        <Link href="https://us.helicone.ai/settings/billing">
          <Button variant="secondary" className="w-full text-base py-5">
            7-day free trial
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default TeamCard;
