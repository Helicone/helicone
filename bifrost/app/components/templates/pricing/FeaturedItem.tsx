import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";

export const FeatureItem: React.FC<{
  title: string;
  description?: string | React.ReactNode;
}> = ({ title, description }) => (
  <Row className="items-start gap-[12px]">
    <CheckIcon
      className="mt-[2px] h-[18px] w-[18px] stroke-[3px] text-[#6AA84F]"
      width={18}
      height={18}
    />
    <Col className="gap-[4px]">
      <h3 className="text-[16px] font-medium text-slate-700">{title}</h3>
      {description && (
        <h4 className="text-[14px] font-light text-slate-700">{description}</h4>
      )}
    </Col>
  </Row>
);
