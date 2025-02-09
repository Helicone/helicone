import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { CheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FreeCard: React.FC = () => {
  return (
    <Card className="w-full h-full p-6 bg-white rounded-xl border-none shadow-none mx-auto">
      <Col className="h-full justify-between gap-4">
        <Col className="gap-3">
          <div className="text-slate-900 text-sm font-medium leading-tight">
            Hobby
          </div>

          <Col className="h-full gap-2">
            <div className="text-slate-900 text-3xl font-bold">Free</div>
            <div className="text-slate-700 text-sm font-normal">
              Kickstart your AI project.
            </div>
          </Col>

          <Col>
            {[
              "10,000 free requests",
              "Requests and Dashboard",
              "Free, truly.",
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

        <Link href="https://us.helicone.ai/signup">
          <Button variant="secondary" className="w-full text-base py-6">
            Get started
          </Button>
        </Link>
      </Col>
    </Card>
  );
};

export default FreeCard;
