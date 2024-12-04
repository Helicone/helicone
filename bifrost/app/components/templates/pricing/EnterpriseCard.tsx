import { Card } from "@/components/ui/card";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FeatureItem } from "./FeaturedItem";
import Link from "next/link";

const EnterpriseCard: React.FC = () => {
  return (
    <Card className="p-[24px] bg-slate-50 h-[500px] border-none shadow-none">
      <Col className="h-full justify-between">
        <Col className="gap-[24px]">
          <div className="px-[12px] py-[6px] border-2 border-slate-200 text-slate-900 w-fit rounded-[4px] font-medium">
            Enterprise
          </div>
          <Col className="gap-[8px]">
            <h3 className="text-[36px] font-bold text-slate-900">Contact us</h3>
            <Col>
              <h4 className="text-[16px] text-slate-700 font-light">
                For companies{" "}
                <span className="font-semibold">looking to scale.</span>
              </h4>
              <h4 className="text-[14px] text-slate-700">
                Everything in Pro, plus:
              </h4>
            </Col>
          </Col>
        </Col>
        <Col className="gap-[16px]">
          <FeatureItem title="SOC-2 Compliance" />
          <FeatureItem title="SSO (Single Sign-On)" />
          <FeatureItem title="Dedicated SLAs" />
        </Col>
        <Link
          href="/contact"
          className="bg-[#FFFFFF] text-slate-900 py-[12px] border border-slate-200 rounded-[4px] mt-[8px] text-[16px] text-center"
        >
          Contact sales
        </Link>
      </Col>
    </Card>
  );
};

export default EnterpriseCard;
