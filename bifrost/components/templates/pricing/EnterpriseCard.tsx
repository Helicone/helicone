import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";

const EnterpriseCard = () => {
  return (
    <div className="h-[300px] w-full">
      <Col className="h-full">
        <Col className="h-full justify-between px-[24px] py-[36px]">
          <h1>
            <b>Critical bug detected</b>, saved agent runtime by 30%.
          </h1>
          <div className="h-[43px] w-[175px] bg-blue-100">LOGO</div>
        </Col>
        <Row className="h-[72px] w-full items-center justify-between border-t px-[24px]">
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
