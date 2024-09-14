import { useOrg } from "@/components/layout/organizationContext";
import AuthHeader from "@/components/shared/authHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FreePlanCard } from "./freeBillingPage";

interface OrgPlanPageProps {}

const BillingPlanPage = (props: OrgPlanPageProps) => {
  const org = useOrg();
  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

  const upcomingInvoice = useQuery({
    queryKey: ["upcoming-invoice", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const invoice = await jawn.GET("/v1/stripe/subscription/preview-invoice");
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

  const upgradeExistingCustomerToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
      );
      return result;
    },
  });

  const manageSubscriptionPaymentLink = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/manage-subscription"
      );
      return result;
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/cancel-subscription"
      );
      return result;
    },
  });

  const undoCancelSubscription = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/undo-cancel-subscription"
      );
      return result;
    },
  });

  const addProductToSubscription = useMutation({
    mutationFn: async (productType: "alerts" | "prompts") => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.POST(
        "/v1/stripe/subscription/add-ons/{productType}",
        {
          params: {
            path: {
              productType,
            },
          },
        }
      );
      return result;
    },
  });

  const deleteProductFromSubscription = useMutation({
    mutationFn: async (productType: "alerts" | "prompts") => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.DELETE(
        "/v1/stripe/subscription/add-ons/{productType}",
        {
          params: {
            path: {
              productType,
            },
          },
        }
      );
      return result;
    },
  });
  return (
    <>
      <AuthHeader
        title={<div className="flex items-center gap-2">Billing</div>}
      />
      {org?.currentOrg?.tier === "free" && <FreePlanCard />}
      <div>status: {subscription.data?.data?.status}</div>
      {subscription.data?.data?.trial_end && (
        <div>
          trial_end:{" "}
          {new Date(
            subscription.data?.data?.trial_end * 1000
          ).toLocaleDateString()}
        </div>
      )}
      {subscription.data?.data?.canceled_at && (
        <div>
          Subscription canceled on:{" "}
          {new Date(
            subscription.data.data.canceled_at * 1000
          ).toLocaleDateString()}
        </div>
      )}

      <div>
        Is pending cancel:{" "}
        {subscription.data?.data?.cancel_at_period_end ? "Yes" : "No"}
      </div>
      {subscription.data?.data?.cancel_at_period_end &&
        subscription.data?.data?.current_period_end && (
          <div>
            Subscription ends on:{" "}
            {new Date(
              subscription.data.data.current_period_end * 1000
            ).toLocaleDateString()}
          </div>
        )}
      <div className="flex flex-col gap-4 whitespace-pre-wrap">
        {subscription.data?.data?.items.data.map((item) => (
          <div key={item.id}>
            {item.price.product.name}
            {item.subscription}

            {item.deleted ? "Deleted" : "Not Deleted"}
            {item.price.active ? "Active" : "Inactive"}
            {item.plan.deleted}

            <div>{item.quantity}</div>
          </div>
        ))}
        <div className="bg-white shadow-md rounded-lg p-6 mt-4">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Invoice</h2>
          {upcomingInvoice.data?.data && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total:</p>
                  <p>
                    ${(upcomingInvoice.data.data.total / 100).toFixed(2)}{" "}
                    {upcomingInvoice.data.data.currency.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Due Date:</p>
                  <p>
                    {new Date(
                      upcomingInvoice.data.data?.next_payment_attempt * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-2">Line Items:</h3>
              {upcomingInvoice.data.data?.lines.data.map((item, index) => (
                <div key={index} className="border-t py-3">
                  <p className="font-medium">{item.description}</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Quantity: {item.quantity}</span>
                    <span>
                      Amount: ${(item.amount / 100).toFixed(2)}{" "}
                      {upcomingInvoice.data.data?.currency.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}

              {upcomingInvoice.data.data.discount && (
                <div className="mt-4">
                  <p className="font-medium">Discount:</p>
                  <p>
                    {upcomingInvoice.data.data.discount.coupon.name} -{" "}
                    {upcomingInvoice.data.data.discount.coupon.percent_off}% off
                  </p>
                </div>
              )}

              <div className="mt-6 text-right">
                <p className="font-medium">
                  Subtotal: $
                  {(upcomingInvoice.data.data.subtotal / 100).toFixed(2)}{" "}
                  {upcomingInvoice.data.data.currency.toUpperCase()}
                </p>
                <p className="font-medium">
                  Tax: ${(upcomingInvoice.data.data.tax / 100).toFixed(2)}{" "}
                  {upcomingInvoice.data.data.currency.toUpperCase()}
                </p>
                <p className="text-xl font-bold mt-2">
                  Total: ${(upcomingInvoice.data.data.total / 100).toFixed(2)}{" "}
                  {upcomingInvoice.data.data.currency.toUpperCase()}
                </p>
              </div>
            </>
          )}
        </div>

        <Button
          onClick={async () => {
            const result = await upgradeNewCustomerToPro.mutateAsync();
            console.log(result.data);
            if (result.data) {
              window.open(result.data, "_blank");
            } else {
              console.error("No URL returned from upgrade mutation");
            }
          }}
        >
          Upgrade to Pro
        </Button>
        <Button
          onClick={async () => {
            const result = await manageSubscriptionPaymentLink.mutateAsync();
            console.log(result.data);
            if (result.data) {
              window.open(result.data, "_blank");
            } else {
              console.error(
                "No URL returned from manage subscription mutation"
              );
            }
          }}
        >
          Manage Subscription
        </Button>
        <Button
          onClick={async () => {
            const result = await cancelSubscription.mutateAsync();
            console.log(result.data);
          }}
        >
          Cancel Subscription
        </Button>
        <Button
          onClick={async () => {
            const result = await upgradeExistingCustomerToPro.mutateAsync();
            console.log(result.data);
            if (result.data) {
              window.open(result.data, "_blank");
            } else {
              console.error(
                "No URL returned from upgrade existing customer mutation"
              );
            }
          }}
        >
          Upgrade Existing Customer
        </Button>
        <Button
          onClick={async () => {
            const result = await undoCancelSubscription.mutateAsync();
            console.log(result.data);
          }}
        >
          Undo Cancel Subscription
        </Button>
        <Button
          onClick={async () => {
            const result = await addProductToSubscription.mutateAsync("alerts");
            console.log(result.data);
          }}
        >
          Add Alerts
        </Button>
        <Button
          onClick={async () => {
            const result = await deleteProductFromSubscription.mutateAsync(
              "alerts"
            );
            console.log(result.data);
          }}
        >
          Delete Alerts
        </Button>
        <Button
          onClick={async () => {
            const result = await addProductToSubscription.mutateAsync(
              "prompts"
            );
            console.log(result.data);
          }}
        >
          Add Prompts
        </Button>
        <Button
          onClick={async () => {
            const result = await deleteProductFromSubscription.mutateAsync(
              "prompts"
            );
            console.log(result.data);
          }}
        >
          Delete Prompts
        </Button>
      </div>
    </>
  );
};

export default BillingPlanPage;
