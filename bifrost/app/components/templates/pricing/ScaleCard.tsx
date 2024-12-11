import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { FeatureItem } from "./FeaturedItem";
import Link from "next/link";

const ScaleCard: React.FC = () => {
  return (
    <Card className="relative p-[24px] bg-white h-[530px] border-brand border-[2px] shadow-none">
      <Card className="absolute top-0 right-0 bg-[#E7F6FD] translate-x-[14px] -translate-y-[14px] rotate-[10.2deg] px-[12px] py-[6px]  border-brand border-[2px] rounded-[4px]">
        <Col className="items-center text-brand">
          <h3 className="text-[16px] font-bold">Recommended</h3>
          <h4 className="text-[14px] font-medium whitespace-nowrap ">
            for <u>production</u> AI apps
          </h4>
        </Col>
      </Card>
      <Col className="h-full justify-between">
        <Col className="gap-[24px]">
          <div className="px-[12px] py-[6px] w-fit rounded-[3px] bg-slate-200 text-slate-900 font-medium">
            Pro
          </div>
          <Col className="gap-[8px]">
            <Row className="items-center gap-[4px]">
              <Row className="text-[36px] font-bold text-brand items-center gap-[2px]">
                <span className="text-[32px]">$20</span>
                <span className="text-[18px]">/user</span>
              </Row>
              <Row className="text-[18px] text-slate-900 font-semibold">
                <span>per month</span>
                <span className="text-slate-500 text-[14px]">
                  <span className="text-brand">*</span>
                </span>
              </Row>
            </Row>
            <Row className="text-[14px] text-slate-500 items-center gap-[4px]">
              <span className="text-brand">*</span>
              <span>Billed annually, monthly is $24</span>
            </Row>

            <Col>
              <h4 className="text-[16px] text-slate-700 font-light">
                Essential features{" "}
                <span className="font-semibold">for the entire team</span>.
              </h4>
              <h4 className="text-[14px] text-slate-700 font-light">
                Everything in Free, plus:
              </h4>
            </Col>
          </Col>
        </Col>
        <Col className="gap-[16px]">
          <FeatureItem
            title="Every feature you need"
            description="From Sessions, Datasets, Caching, Evals and more."
          />
          {/* <FeatureItem
            title="Standard support"
            description="Support via email, Discord or Slack."
          /> */}
          <FeatureItem
            title="Usage-based pricing"
            description={
              <>
                Only pay for what you use after the free limit.{" "}
                <Link href="#compare-plans" className="text-brand">
                  See more.
                </Link>
              </>
            }
          />
          <FeatureItem
            title="Standard support"
            description="Support via email, Discord or Slack."
          />
        </Col>
        <Link
          href="https://us.helicone.ai/settings/billing"
          className="bg-brand text-white py-[12px] rounded-[4px] mt-[8px] text-[16px] font-semibold text-center"
        >
          Upgrade Now
        </Link>
      </Col>
    </Card>
  );
};

export default ScaleCard;
