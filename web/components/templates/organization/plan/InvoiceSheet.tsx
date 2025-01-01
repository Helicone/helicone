import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";

import { LLMUsageItem } from "./InvoiceSheetLLMUsage";

export const InvoiceSheet: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const org = useOrg();

  const upcomingInvoice = useQuery({
    queryKey: ["upcoming-invoice", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const invoice = await jawn.GET("/v1/stripe/subscription/preview-invoice");

      return invoice;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: upcomingInvoice.data?.data?.currency || "USD",
      maximumFractionDigits: 6,
    }).format(amount / 100);
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">View Upcoming Invoice</Button>
      </SheetTrigger>
      <SheetContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Upcoming Invoice</SheetTitle>
          <SheetDescription>
            Details of your next billing cycle
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {upcomingInvoice.isLoading ? (
            <p>Loading invoice details...</p>
          ) : upcomingInvoice.error ? (
            <p>Error loading invoice. Please try again.</p>
          ) : upcomingInvoice.data?.data ? (
            <>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Due:</span>
                <span className="text-xl font-bold">
                  {formatCurrency(
                    upcomingInvoice.data.data.total +
                      upcomingInvoice.data.data.experiments_usage.reduce(
                        (acc, item) => acc + item.amount,
                        0
                      )
                  )}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Due Date:{" "}
                {new Date(
                  upcomingInvoice.data.data.next_payment_attempt! * 1000
                ).toLocaleDateString()}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Line Items:</h3>
                <div className="space-y-3">
                  {upcomingInvoice.data.data.lines?.data.map(
                    (item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>{item.description}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    )
                  )}
                  {upcomingInvoice.data.data.experiments_usage.length > 0 && (
                    <>
                      <h4 className="font-medium">Experiments</h4>
                      {upcomingInvoice.data.data.experiments_usage.map(
                        (
                          item: {
                            amount: number;
                            description: string;
                            model: string;
                            provider: string;
                            prompt_tokens: number;
                            completion_tokens: number;
                            totalCost: {
                              completion_token: number;
                              prompt_token: number;
                            };
                          },
                          index: number
                        ) => (
                          <LLMUsageItem
                            item={item}
                            formatCurrency={formatCurrency}
                            key={index}
                          />
                        )
                      )}
                    </>
                  )}
                  {upcomingInvoice.data.data.evaluators_usage.length > 0 && (
                    <>
                      <h4 className="font-medium">Evaluators</h4>
                      {upcomingInvoice.data.data.evaluators_usage.map(
                        (
                          item: {
                            amount: number;
                            description: string;
                            model: string;
                            provider: string;
                            prompt_tokens: number;
                            completion_tokens: number;
                            totalCost: {
                              completion_token: number;
                              prompt_token: number;
                            };
                          },
                          index: number
                        ) => (
                          <LLMUsageItem
                            item={item}
                            formatCurrency={formatCurrency}
                            key={index}
                          />
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
              {upcomingInvoice.data.data.discount && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Discount:</h3>
                  <div className="text-sm flex items-center gap-2 justify-between">
                    <span className="">
                      {upcomingInvoice.data.data.discount.coupon.name}
                    </span>
                    <span>
                      {upcomingInvoice.data.data.discount.coupon.amount_off
                        ? `$${
                            upcomingInvoice.data.data.discount.coupon
                              .amount_off / 100
                          } off`
                        : `${upcomingInvoice.data.data.discount.coupon.percent_off}% off`}
                    </span>
                  </div>
                </div>
              )}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(upcomingInvoice.data.data.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Tax:</span>
                  <span>
                    {formatCurrency(upcomingInvoice.data.data.tax ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span>
                    {formatCurrency(
                      upcomingInvoice.data.data.total +
                        upcomingInvoice.data.data.experiments_usage.reduce(
                          (acc, item) => acc + item.amount,
                          0
                        )
                    )}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p>No invoice data available.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
