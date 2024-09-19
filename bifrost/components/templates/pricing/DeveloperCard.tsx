import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";

const DeveloperCard = () => {
  return (
    <div className="h-[250px] w-full">
      <Col className="h-full">
        <Col className="py-[36px] px-[24px] justify-between h-full">
          <h1>
            <b>386 hours</b> saved by using cached responses.
          </h1>
          <div className="bg-blue-100 h-[43px] w-[175px]">LOGO</div>
        </Col>
        <Row className="w-full h-[72px] px-[24px] items-center justify-between border-t">
          <span>Developer</span>
          <Button variant={"outline"}>Start for Free</Button>
        </Row>
      </Col>
    </div>
  );
};

export default DeveloperCard;
