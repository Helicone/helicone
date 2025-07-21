import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Check } from "lucide-react";
import { FeatureItem } from "./FeaturedItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const EnterpriseCard: React.FC = () => {
  return (
    <Card className="bg-background border-border mx-auto h-full w-full border-spacing-1.5 rounded-xl p-6 md:border-transparent md:shadow-none">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-6">
          <Col className="h-full gap-2">
            <div className="text-accent-foreground text-md font-semibold leading-tight">
              Enterprise
            </div>
            <div className="text-accent-foreground text-3xl font-bold">
              Contact us
            </div>
            <div className="text-sidebar-foreground text-sm font-normal">
              Custom-built packages.
            </div>
          </Col>

          <Col>
            {[
              "Everything in Team",
              "Custom MSA",
              "SAML SSO",
              "On-prem deployment",
              "Bulk cloud discounts",
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
            Contact sales
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default EnterpriseCard;
