import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Small, XSmall } from "@/components/ui/typography";
import { CheckCircle, CreditCard, AlertCircle, Wallet, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useAutoTopoffSettings,
  usePaymentMethods,
} from "../../../services/hooks/useAutoTopoff";

interface LastTopoffDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LastTopoffDetailsModal({
  isOpen,
  onClose,
}: LastTopoffDetailsModalProps) {
  const { data: settings } = useAutoTopoffSettings();
  const { data: paymentMethods } = usePaymentMethods();

  if (!settings?.lastTopoffAt) {
    return null;
  }

  // Find the payment method that was used
  const paymentMethod = paymentMethods?.find(
    (pm) => pm.id === settings.stripePaymentMethodId
  );

  const hasFailures = settings.consecutiveFailures > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Zap size={20} />
              Last Auto Top-Up
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {hasFailures ? (
              <Badge variant="destructive">Failed</Badge>
            ) : (
              <Badge variant="default" className="bg-green-600">
                Completed
              </Badge>
            )}
          </div>

          {/* Date/Time */}
          <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-muted-foreground" />
              <Small className="font-medium">Date & Time</Small>
            </div>
            <XSmall className="text-muted-foreground ml-6">
              {new Date(settings.lastTopoffAt).toLocaleString()}
            </XSmall>
          </div>

          {/* Amount Details */}
          <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-muted-foreground" />
              <Small className="font-medium">Amount Details</Small>
            </div>
            <div className="flex flex-col gap-1 ml-6">
              <XSmall className="text-muted-foreground">
                Credits Added: ${(settings.topoffAmountCents / 100).toFixed(2)}
              </XSmall>
              <XSmall className="text-muted-foreground">
                Triggered at: ${(settings.thresholdCents / 100).toFixed(2)}{" "}
                balance
              </XSmall>
            </div>
          </div>

          {/* Payment Method */}
          {paymentMethod && (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-muted-foreground" />
                <Small className="font-medium">Payment Method</Small>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <XSmall className="text-muted-foreground">
                  <span className="capitalize">{paymentMethod.brand}</span> ••••{" "}
                  {paymentMethod.last4}
                </XSmall>
              </div>
            </div>
          )}

          {/* Failure Warning */}
          {hasFailures && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle size={16} className="mt-0.5 text-destructive" />
              <div className="flex flex-col gap-1">
                <XSmall className="font-medium text-destructive">
                  Payment Failed
                </XSmall>
                <XSmall className="text-destructive/80">
                  This auto top-up attempt failed {settings.consecutiveFailures}{" "}
                  {settings.consecutiveFailures === 1 ? "time" : "times"}. Please
                  check your payment method.
                </XSmall>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
