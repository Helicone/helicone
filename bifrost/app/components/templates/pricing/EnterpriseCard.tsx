import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FeatureItem } from "./FeaturedItem";

const EnterpriseCard: React.FC = () => {
  return (
    <Card className="p-[24px] bg-[#F9F9F9] h-[500px]">
      <Col className="h-full justify-between">
        <Col className="gap-[24px]">
          <div className="px-[12px] py-[6px] border border-[#E2E8F0] w-fit rounded-[3px] bg-[#F9F9F9]">
            Enterprise
          </div>
          <Col className="gap-[8px]">
            <h3 className="text-[36px] font-extrabold">Contact us</h3>
            <h4 className="text-[18px]">
              Everything to <b>kickstart your AI project</b>.
            </h4>
          </Col>
        </Col>
        <Col className="gap-[16px]">
          <FeatureItem
            title="Training and Optimization"
            description="Dedicated slack channel"
          />
          <FeatureItem
            title="On-prem support"
            description="Custom HELM charts and work with SREs"
          />
          <FeatureItem title="High availability and scaling" description="" />
        </Col>
        <button className="bg-[#1E293B] text-white py-[12px] rounded-[4px] mt-[8px] text-[16px] font-semibold">
          Start for free
        </button>
      </Col>
    </Card>
  );
};

export default EnterpriseCard;
