import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";

const EnterpriseCard = () => {
  return (
    <div className="h-[300px] w-full">
      <Col className="h-full">
        <Col className="py-[36px] px-[24px] justify-between h-full">
          <h1>
            <b>Critical bug detected</b>, saved agent runtime by 30%.
          </h1>
          <div className="bg-blue-100 h-[43px] w-[175px]">LOGO</div>
        </Col>
        <Row className="w-full h-[72px] px-[24px] items-center justify-between border-t">
          <span>Enterprise</span>
          <Button asChild variant={"outline"}>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </Row>
      </Col>
    </div>
  );
};

export default EnterpriseCard;
