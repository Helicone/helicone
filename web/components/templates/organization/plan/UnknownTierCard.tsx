import { Col } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface UnknownTierCardProps {
  tier: string;
}

export const UnknownTierCard: React.FC<UnknownTierCardProps> = ({ tier }) => {
  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Unknown Plan</CardTitle>
          <CardDescription>
            We couldn&apos;t recognize your current plan. We&apos;ve sent
            migration instructions to your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Col className="gap-6">
            <div className="text-sm text-gray-500">
              Your current plan: <span className="font-semibold">{tier}</span>
            </div>
            <Col className="gap-2">
              <Link href="mailto:support@helicone.ai">
                <Button>Email Support</Button>
              </Link>
              <p className="text-xs text-gray-500 text-center">
                If you&apos;re still having trouble, please email our support
                team at {"support@helicone.ai"} for assistance.
              </p>
            </Col>
          </Col>
        </CardContent>
      </Card>
    </div>
  );
};
