import { Col, Row } from "@/components/layout/common";
import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getJawnClient } from "@/lib/clients/jawn";
import { CardContent } from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";

export const FreePlanCard = () => {
  const org = useOrg();
  const freeUsage = useQuery({
    queryKey: ["free-usage", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const invoice = await jawn.GET("/v1/stripe/subscription/free/usage");
      return invoice;
    },
  });

  const upgradeNewCustomerToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/new-customer/upgrade-to-pro"
      );
      return result;
    },
  });

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

  const isOverUsage = freeUsage.data?.data && freeUsage.data?.data >= 10_000;

  const upgradeExistingCustomerToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
      );
      return result;
    },
  });

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Free Plan</CardTitle>
          <CardDescription>
            {isOverUsage && (
              <div className="text-sm text-red-500 pb-2">
                You have exceeded your free usage limit. Upgrade to Pro to
                continue using Helicone.
              </div>
            )}
            You are currently on the free plan. Below you will see the monthly
            usage for your requests.
          </CardDescription>
          <CardContent>
            <Col className="gap-10">
              <Row className="items-end gap-2">
                <div className="text-2xl font-bold">
                  {freeUsage.data?.data} / 10,000
                </div>
                <div className="text-sm text-gray-500">
                  requests used this month
                </div>
              </Row>
              <Progress
                value={(freeUsage.data?.data ?? 0) / 10_000}
                className="w-[60%]"
              />
              <Col className="gap-2">
                {subscription.data?.data?.status === "canceled" && (
                  <div className="text-sm text-gray-500">
                    We missed you! Upgrade to Pro to continue using Helicone.
                  </div>
                )}
                <Button
                  className="bg-sky-500 hover:bg-sky-600"
                  onClick={async () => {
                    if (subscription.data?.data?.status === "canceled") {
                      const result =
                        await upgradeExistingCustomerToPro.mutateAsync();
                      if (result.data) {
                        window.open(result.data, "_blank");
                      } else {
                        console.error(
                          "No URL returned from manage subscription mutation"
                        );
                      }
                    } else {
                      const result =
                        await upgradeNewCustomerToPro.mutateAsync();
                      console.log(result.data);
                      if (result.data) {
                        window.open(result.data, "_blank");
                      } else {
                        console.error("No URL returned from upgrade mutation");
                      }
                    }
                  }}
                  disabled={
                    upgradeNewCustomerToPro.isLoading ||
                    upgradeExistingCustomerToPro.isLoading
                  }
                >
                  {upgradeNewCustomerToPro.isLoading ||
                  upgradeExistingCustomerToPro.isLoading
                    ? "Loading..."
                    : subscription.data?.data?.status === "canceled"
                    ? "Upgrade to Pro"
                    : "Pro - Start Free Trial"}
                </Button>
                <Link
                  href="https://helicone.ai/pricing"
                  className="text-sm text-gray-500 underline"
                >
                  Compare different plans
                </Link>
              </Col>
            </Col>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
};
