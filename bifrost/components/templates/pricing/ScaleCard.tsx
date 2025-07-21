import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";

const ScaleCard = () => {
  return (
    <div className="border-brand h-[300px] w-full rounded-lg border-2 bg-white">
      <Col className="h-full">
        <Col className="h-full justify-between px-[24px] py-[36px]">
          <h1>
            <b>2 days</b> saved combing through requests.
          </h1>
          <div className="h-[43px] w-[175px] bg-blue-100">LOGO</div>
        </Col>
        <Row className="h-[72px] w-full items-center justify-between border-t px-[24px]">
          <span>Scale</span>
          <Button className="bg-brand text-white" asChild>
            <Link href="https://us.helicone.ai/settings/billing">
              Start 7-day free trial
            </Link>
          </Button>
        </Row>
      </Col>
    </div>
  );
};

export default ScaleCard;
