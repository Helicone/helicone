import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const ContactCTA = ({}) => {
  return (
    <div className="mt-2 rounded-lg border p-4">
      <Row className="flex items-center justify-between">
        <Col>
          <h3 className="mb-2 font-semibold">Let&apos;s talk</h3>
          <p className="text-sm">
            Contact us with any questions or to get more features.
          </p>
        </Col>
        <Button asChild>
          <Link
            href="https://cal.com/team/helicone/helicone-discovery"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us
          </Link>
        </Button>
      </Row>
    </div>
  );
};
