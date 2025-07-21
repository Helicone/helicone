import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import Link from "next/link";

const DeveloperCard = () => {
  return (
    <div className="h-[250px] w-full">
      <Col className="h-full">
        <Col className="h-full justify-between px-[24px] py-[36px]">
          <h1>
            <b>386 hours</b> saved by using cached responses.
          </h1>
          <div className="h-[43px] w-[175px] bg-blue-100">LOGO</div>
        </Col>
        <Row className="h-[72px] w-full items-center justify-between border-t px-[24px]">
          <span>Developer</span>
          <Button variant={"outline"} asChild>
            <Link href="https://us.helicone.ai/signin">Start for Free</Link>
          </Button>
        </Row>
      </Col>
    </div>
  );
};

export default DeveloperCard;
