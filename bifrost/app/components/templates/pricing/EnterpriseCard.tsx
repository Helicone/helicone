import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Check } from "lucide-react";
import { FeatureItem } from "./FeaturedItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const EnterpriseCard: React.FC = () => {
  return (
    <Card className="w-full h-full p-6 bg-background rounded-xl border-spacing-1.5 border-border md:border-transparent md:shadow-none mx-auto">
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
            Contact sales
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default EnterpriseCard;
