import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FeatureItem } from "./FeaturedItem";

const FreeCard: React.FC = () => {
  return (
    <Card className="p-[24px] bg-slate-50 h-[500px] border-none shadow-none">
      <Col className="h-full justify-between">
        <Col className="gap-[24px]">
          <div className="px-[12px] py-[6px] border-2 border-slate-200 w-fit rounded-[4px] bg-slate-50 text-slate-900 font-medium">
            Free
          </div>
          <Col className="gap-[8px]">
            <h3 className="text-[36px] font-bold">Free</h3>
            <h4 className="text-[16px] text-slate-700 font-light">
              Everything to{" "}
              <span className="font-semibold">kickstart your AI project</span>.
            </h4>
          </Col>
        </Col>
        <Col className="gap-[16px] ">
          <FeatureItem
            title="Generous free monthly tier"
            description="10k free requests/month."
          />
          <FeatureItem
            title="Access to Dashboard"
            description="Watch your AI app improve."
          />
          <FeatureItem
            title="Free, truly."
            description="No credit card required."
          />
        </Col>
        <button className="bg-[#FFFFFF] text-slate-900 py-[12px] border border-slate-200 rounded-[4px] mt-[8px] text-[16px]">
          Get started
        </button>
      </Col>
    </Card>
  );
};

export default FreeCard;
