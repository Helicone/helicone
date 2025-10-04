import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FreeCard: React.FC = () => {
  return (
    <Card className="w-full h-full p-6 bg-background rounded-xl border-spacing-1.5 border-border md:border-transparent md:shadow-none mx-auto">
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

        <Link href="/signup">
          <Button variant="secondary" className="w-full text-base py-5">
            Get started for free
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default FreeCard;
