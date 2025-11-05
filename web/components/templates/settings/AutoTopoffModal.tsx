import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Small, Muted, XSmall } from "@/components/ui/typography";
import { AlertCircle, CreditCard, Zap } from "lucide-react";
import {
  useAutoTopoffSettings,
  useUpdateAutoTopoffSettings,
  usePaymentMethods,
  useCreateSetupSession,
  useRemovePaymentMethod,
} from "../../../services/hooks/useAutoTopoff";

interface AutoTopoffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutoTopoffModal({ isOpen, onClose }: AutoTopoffModalProps) {
  const { data: settings, isLoading: settingsLoading } =
    useAutoTopoffSettings();
  const { data: paymentMethods, isLoading: paymentMethodsLoading } =
    usePaymentMethods();
  const updateSettings = useUpdateAutoTopoffSettings();
  const createSetupSession = useCreateSetupSession();
  const removePaymentMethod = useRemovePaymentMethod();

  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [threshold, setThreshold] = useState(
    settings?.thresholdCents ? (settings.thresholdCents / 100).toString() : ""
  );
  const [topoffAmount, setTopoffAmount] = useState(
    settings?.topoffAmountCents
      ? (settings.topoffAmountCents / 100).toString()
      : ""
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    settings?.stripePaymentMethodId ?? ""
  );

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setThreshold((settings.thresholdCents / 100).toString());
      setTopoffAmount((settings.topoffAmountCents / 100).toString());
      setSelectedPaymentMethod(settings.stripePaymentMethodId ?? "");
    }
  }, [settings]);

  const handleSave = async () => {
    const thresholdCents = Math.round(parseFloat(threshold || "0") * 100);
    const topoffAmountCents = Math.round(parseFloat(topoffAmount || "0") * 100);

    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    if (thresholdCents < 0) {
      alert("Threshold must be non-negative");
      return;
    }

    if (topoffAmountCents < 500) {
      alert("Top-off amount must be at least $5");
      return;
    }

    if (topoffAmountCents > 1000000) {
      alert("Top-off amount must not exceed $10,000");
      return;
    }

    await updateSettings.mutateAsync({
      body: {
        enabled,
        thresholdCents,
        topoffAmountCents,
        stripePaymentMethodId: selectedPaymentMethod,
      },
    });

    onClose();
  };

  if (settingsLoading || paymentMethodsLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Zap size={20} />
                Auto Top-Up Settings
              </div>
            </DialogTitle>
          </DialogHeader>
          <Muted className="text-xs">Loading...</Muted>
        </DialogContent>
      </Dialog>
    );
  }

  const hasPaymentMethods = paymentMethods && paymentMethods.length > 0;

  const handleAddPaymentMethod = async () => {
    await createSetupSession.mutateAsync({
      body: {
        returnUrl: "/credits",
      },
    });
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    // Check if it's the last payment method and auto top-off is enabled
    if (paymentMethods && paymentMethods.length === 1 && enabled) {
      alert(
        "Cannot remove the last payment method while auto top-off is enabled. Please disable auto top-off first."
      );
      return;
    }

    if (confirm("Are you sure you want to remove this payment method?")) {
      await removePaymentMethod.mutateAsync({
        params: { path: { paymentMethodId } },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Zap size={20} />
              Auto Top-Up Settings
            </div>
          </DialogTitle>
          <DialogDescription>
            Automatically purchase credits when your balance falls below a
            threshold.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Auto Top-Up Toggle */}
          <div className="flex items-center justify-between">
            <Small className="font-semibold text-foreground">
              Auto Top-Up
            </Small>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={!hasPaymentMethods}
            />
          </div>

          {/* Payment Methods Management */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Small className="font-semibold text-foreground">
                Payment Methods
              </Small>
              <Button
                onClick={handleAddPaymentMethod}
                disabled={createSetupSession.isPending}
                variant="outline"
                size="sm"
              >
                {createSetupSession.isPending ? "Loading..." : "Add Card"}
              </Button>
            </div>

            {paymentMethods && paymentMethods.length > 0 ? (
              <div className="flex flex-col gap-2">
                {paymentMethods.map((pm) => {
                  const isSelected = pm.id === selectedPaymentMethod;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-muted-foreground" />
                        <div className="flex flex-col">
                          <XSmall className="font-medium">
                            <span className="capitalize">{pm.brand}</span> •••• {pm.last4}
                          </XSmall>
                          <XSmall className="text-muted-foreground">
                            Expires {pm.exp_month}/{pm.exp_year}
                          </XSmall>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePaymentMethod(pm.id);
                          }}
                          disabled={removePaymentMethod.isPending}
                          variant="ghost"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Muted className="text-xs">No payment methods saved</Muted>
            )}
          </div>

          {!hasPaymentMethods ? (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <XSmall className="font-medium">No payment method found</XSmall>
                  <XSmall className="text-muted-foreground">
                    Purchase credits first to save a payment method for auto top-up.
                  </XSmall>
                </div>
              </div>
            </div>
          ) : (
            <>
              {settings?.consecutiveFailures >= 2 && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 text-destructive"
                  />
                  <div className="flex flex-col gap-1">
                    <XSmall className="font-medium text-destructive">
                      Payment failures detected
                    </XSmall>
                    <XSmall className="text-destructive/80">
                      Auto top-up has failed {settings.consecutiveFailures} times.
                      Please check your payment method.
                    </XSmall>
                  </div>
                </div>
              )}

              {enabled && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="threshold" className="text-sm whitespace-nowrap">
                        When balance falls below:
                      </Label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          id="threshold"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="10"
                          value={threshold}
                          onChange={(e) => setThreshold(e.target.value)}
                          className="w-28"
                        />
                      </div>
                    </div>
                    <XSmall className="text-muted-foreground">
                      Processing may take up to 15 minutes.
                    </XSmall>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="topoff-amount" className="text-sm whitespace-nowrap">
                        Amount to purchase:
                      </Label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          id="topoff-amount"
                          type="number"
                          min="5"
                          max="10000"
                          step="1"
                          placeholder="50"
                          value={topoffAmount}
                          onChange={(e) => setTopoffAmount(e.target.value)}
                          className="w-28"
                        />
                      </div>
                    </div>
                    <XSmall className="text-muted-foreground">
                      (minimum $5, maximum $10,000)
                    </XSmall>
                  </div>

                  {/* Rate Limit Warning */}
                  <div className="flex items-start gap-2 rounded-md border border-border bg-muted p-3">
                    <AlertCircle size={16} className="mt-0.5 text-muted-foreground" />
                    <XSmall className="text-muted-foreground">
                      For your protection, auto top-up is limited to once per hour.
                    </XSmall>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={updateSettings.isPending}
                    className="w-full"
                  >
                    {updateSettings.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              )}

              {!enabled && (
                <Button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  variant="outline"
                  className="w-full"
                >
                  Save Settings
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
