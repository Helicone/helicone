import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ScaleCard: React.FC = () => {
  return (
    <Card className="border-brand mx-auto h-full w-full rounded-xl border-2 bg-sky-50 p-6">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-6">
          <Col className="h-full gap-2">
            <Row className="items-center justify-between">
              <div className="text-accent-foreground text-md font-semibold leading-tight">
                Pro
              </div>
              <Badge variant="default">POPULAR</Badge>
            </Row>
            <Row className="items-center gap-0.5">
              <div className="text-brand text-3xl font-bold">$20</div>
              <Row className="items-center gap-1 py-1">
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
              "Scale beyond 10k requests",
              "Core observability features",
              "Standard support",
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

        <div className="text-muted-foreground mt-2 text-xs">
          * Usage-based pricing applies
        </div>

        <Link href="https://us.helicone.ai/settings/billing">
          <Button className="bg-brand w-full py-5 text-base">
            7-day free trial
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default ScaleCard;
