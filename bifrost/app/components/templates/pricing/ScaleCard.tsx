import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

const ScaleCard: React.FC = () => {
  return (
    <Card className="w-full h-full p-6 bg-sky-50 rounded-xl border-2 border-sky-500 mx-auto">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-3">
          <Row className="justify-between items-center">
            <div className="text-slate-900 text-sm font-medium leading-tight">
              Pro
            </div>
            <div className="px-3 py-1 bg-sky-500 rounded-md border-2 border-sky-500">
              <div className="text-center text-white text-xs font-bold leading-[18px]">
                POPULAR
              </div>
            </div>
          </Row>

          <Col className="h-full gap-2">
            <Row className="items-center gap-0.5">
              <div className="text-sky-500 text-3xl font-bold">$20</div>
              <Row className="py-1 items-center gap-1">
                <div className="text-sky-500 text-lg font-bold">/seat</div>
                <div className="text-slate-700 text-lg font-semibold">
                  per month
                </div>
              </Row>
            </Row>
            <div className="text-slate-700 text-sm font-normal">
              Starter plan for teams.
            </div>
          </Col>

          <Col>
            {[
              "Everything in Hobby",
              "No usage limit",
              "Core observability features",
              "Standard support",
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
          <Button variant="default" className="w-full text-base py-6 bg-brand">
            7-day free trial
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default ScaleCard;
