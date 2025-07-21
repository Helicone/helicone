import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FreeCard: React.FC = () => {
  return (
    <Card className="bg-background border-border mx-auto h-full w-full border-spacing-1.5 rounded-xl p-6 md:border-transparent md:shadow-none">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-6">
          <Col className="h-full gap-2">
            <div className="text-accent-foreground text-md font-semibold leading-tight">
              Hobby
            </div>
            <div className="text-accent-foreground text-3xl font-bold">
              Free
            </div>
            <div className="text-sidebar-foreground text-sm font-normal">
              Kickstart your AI project.
            </div>
          </Col>

          <Col>
            {[
              "10,000 free requests",
              "Requests and Dashboard",
              "Free, truly.",
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

        <Link href="/signup">
          <Button variant="secondary" className="w-full py-5 text-base">
            Get started for free
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default FreeCard;
