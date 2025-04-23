import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ScaleCard: React.FC = () => {
  return (
    <Card className="w-full h-full p-6 bg-sky-50 rounded-xl border-2 border-brand mx-auto">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-6">

          <Col className="h-full gap-2">
            <Row className="justify-between items-center">
              <div className="text-accent-foreground text-md font-semibold leading-tight">
                Pro
              </div>
              <Badge variant="default">POPULAR</Badge>
            </Row>
            <Row className="items-center gap-0.5">
              <div className="text-brand text-3xl font-bold">$20</div>
              <Row className="py-1 items-center gap-1">
                <div className="text-brand text-lg font-bold">/seat</div>
                <div className="text-accent-foreground text-lg font-semibold">
                  per month
                </div>
              </Row>
            </Row>
            <div className="text-sidebar-foreground text-sm font-normal">
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
          <Button className="w-full text-base py-5 bg-brand">
            7-day free trial
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default ScaleCard;
