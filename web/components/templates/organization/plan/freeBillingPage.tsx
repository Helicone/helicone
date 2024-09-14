import { useOrg } from "@/components/layout/organizationContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJawnClient } from "@/lib/clients/jawn";
import { CardContent } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

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
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Free Plan</CardTitle>
          <CardDescription>You are currently on the free plan.</CardDescription>
          <CardContent>
            <div>
              <div>{freeUsage.data?.data} / 10,000</div>
              <div>
                <div>
                  <div></div>
                </div>
              </div>
            </div>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
};
