import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FeatureItem } from "./FeaturedItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TeamCard: React.FC = () => {
  return (
    <Card className="w-full h-full p-6 bg-white rounded-xl border-none shadow-none mx-auto">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-3">
          <Row className="justify-between items-center">
            <div className="text-slate-900 text-sm font-medium leading-tight">
              Team
            </div>
            <div className="px-3 py-1 bg-slate-100 rounded-md">
              <div className="text-center text-slate-500 text-xs font-bold">
                BEST VALUE
              </div>
            </div>
          </Row>

          <Col className="h-full gap-2">
            <Row className="items-center gap-0.5">
              <div className="text-slate-900 text-3xl font-bold">$200</div>
              <div className="text-slate-700 text-lg font-semibold">
                per month
              </div>
            </Row>
            <div className="text-slate-700 text-sm font-normal">
              For growing companies.
            </div>
          </Col>

          <Col>
            {[
              "Everything in Pro",
              "Unlimited seats",
              "Prompts, Experiments and Evals.",
              "SOC-2 Compliance & HIPAA",
              "Dedicated Slack channel",
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
            7-day free trial
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default TeamCard;
