import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FeatureItem } from "./FeaturedItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const EnterpriseCard: React.FC = () => {
  return (
    <Card className="w-full h-full p-6 bg-white rounded-xl border-none shadow-none mx-auto">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-3">
          <div className="text-slate-900 text-sm font-medium leading-tight">
            Enterprise
          </div>

          <Col className="h-full gap-2">
            <div className="text-slate-900 text-3xl font-bold">Contact us</div>
            <div className="text-slate-700 text-sm font-normal">
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
              <div key={index} className="px-2 py-1.5 flex items-start gap-2">
                <div className="w-5 h-5 relative overflow-hidden">
                  <CheckIcon className="w-full h-full" />
                </div>
                <div className="text-slate-700 text-sm font-medium">
                  {feature}
                </div>
              </div>
            ))}
          </Col>
        </Col>

        <Link href="https://us.helicone.ai/settings/billing">
          <Button variant="secondary" className="w-full text-base py-6">
            Get started
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default EnterpriseCard;
