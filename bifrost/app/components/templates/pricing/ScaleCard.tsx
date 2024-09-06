import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FeatureItem } from "./FeaturedItem";

const ScaleCard: React.FC = () => {
  return (
    <Card className="relative p-[24px] bg-white h-[500px] border-[#0CA5EA] border-[2px] ">
      <Card className="absolute top-0 right-0 bg-[#E7F6FD] translate-x-[14px] -translate-y-[14px] rotate-[10.2deg] px-[12px] py-[6px]  border-[#0CA5EA] border-[2px] rounded-[4px]">
        <Col className="items-center text-[#0CA5EA]">
          <h3 className="text-[14px] font-extrabold ">Recommended</h3>
          <h4 className="text-[12px] whitespace-nowrap ">
            for <u>serious</u> AI developers
          </h4>
        </Col>
      </Card>
      <Col className="h-full justify-between">
        <Col className="gap-[24px]">
          <div className="px-[12px] py-[6px]  w-fit rounded-[3px] bg-[#E7F6FD] font-semibold">
            Team
          </div>
          <Col className="gap-[8px]">
            <Row className="items-center gap-[8px]">
              <Row className="text-[36px] font-extrabold text-[#0CA5EA] items-center">
                <Row>
                  <span className="text-[24px] pt-[7px]">$</span>40
                </Row>

                <span className="text-[18px]">/mo</span>
              </Row>

              <Row className="text-[18px] text-black font-semibold line-through">
                $50/mo
              </Row>
            </Row>

            <h4 className="text-[18px]">
              Everything to <b>kickstart your AI project</b>.
            </h4>
          </Col>
        </Col>
        <Col className="gap-[16px]">
          <FeatureItem
            title="Generous free monthly tier"
            description="10k free requests/month."
          />
          <FeatureItem
            title="Access to Dashboard"
            description="Watch your AI app improve."
          />
          <FeatureItem
            title="Unlimited seats"
            description="Invite your whole team!"
          />
        </Col>
        <button className="bg-[#0CA5EA] text-white py-[12px] rounded-[4px] mt-[8px] text-[16px] font-semibold">
          Upgrade Now
        </button>
      </Col>
    </Card>
  );
};

export default ScaleCard;
