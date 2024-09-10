import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { CheckIcon } from "@heroicons/react/24/outline";

export const FeatureItem: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <Row className="gap-[12px] items-start">
    <CheckIcon className="w-[18px] h-[18px] text-[#6AA84F] stroke-[3px] mt-[2px]" />
    <Col className="gap-[4px]">
      <h3 className="text-[16px] font-semibold">{title}</h3>
      <h4 className="text-[14px] text-gray-600">{description}</h4>
    </Col>
  </Row>
);
