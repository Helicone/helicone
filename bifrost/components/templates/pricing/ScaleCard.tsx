import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";

const ScaleCard = () => {
  return (
    <div className="bg-white h-[300px] w-full rounded-lg border-brand border-2">
      <Col className="h-full">
        <Col className="py-[36px] px-[24px] justify-between h-full">
          <h1>
            <b>2 days</b> saved combing through requests.
          </h1>
          <div className="bg-blue-100 h-[43px] w-[175px]">LOGO</div>
        </Col>
        <Row className="w-full h-[72px] px-[24px] items-center justify-between border-t">
          <span>Scale</span>
          <Button className="bg-brand text-white" asChild>
            <Link href="https://us.helicone.ai/settings/billing">
              Upgrade now
            </Link>
          </Button>
        </Row>
      </Col>
    </div>
  );
};

export default ScaleCard;
