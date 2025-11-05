import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Small, Muted, XSmall } from "@/components/ui/typography";
import { AlertCircle, CheckCircle, CreditCard, Zap } from "lucide-react";
import {
  useAutoTopoffSettings,
  useUpdateAutoTopoffSettings,
  usePaymentMethods,
  useCreateSetupSession,
  useRemovePaymentMethod,
} from "../../../services/hooks/useAutoTopoff";

export function AutoTopoffSettings() {
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
  };

  if (settingsLoading || paymentMethodsLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Small className="font-semibold">Auto Top-Up</Small>
        <Muted className="text-xs">Loading...</Muted>
      </div>
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
    if (
      confirm(
        "Are you sure you want to remove this payment method? This will disable auto top-up if it's the only payment method."
      )
    ) {
      await removePaymentMethod.mutateAsync({
        params: { path: { paymentMethodId } },
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-muted-foreground" />
          <CardTitle className="text-base">Auto Top-Up</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between rounded-md border border-border bg-card p-3"
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
                <Button
                  onClick={() => handleRemovePaymentMethod(pm.id)}
                  disabled={removePaymentMethod.isPending}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Muted className="text-xs">No payment methods saved</Muted>
        )}
      </div>

      {/* Auto Top-Up Toggle */}
      <div className="flex items-center justify-between">
        <Small className="font-semibold text-slate-900 dark:text-slate-100">
          Auto Top-Up
        </Small>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={!hasPaymentMethods}
        />
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
          <Muted className="text-xs">
            Automatically purchase credits when your balance falls below a
            threshold.
          </Muted>

          {settings?.consecutiveFailures && settings.consecutiveFailures >= 2 && (
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
                <Label htmlFor="threshold" className="text-xs">
                  Balance Threshold (USD)
                </Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="10"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full"
                />
                <XSmall className="text-muted-foreground">
                  Trigger auto top-up when balance falls below this amount. Processing may take up to 15 minutes.
                </XSmall>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="topoff-amount" className="text-xs">
                  Top-off Amount (USD)
                </Label>
                <Input
                  id="topoff-amount"
                  type="number"
                  min="5"
                  max="10000"
                  step="1"
                  placeholder="50"
                  value={topoffAmount}
                  onChange={(e) => setTopoffAmount(e.target.value)}
                  className="w-full"
                />
                <XSmall className="text-muted-foreground">
                  Amount to purchase (minimum $5, maximum $10,000)
                </XSmall>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="payment-method" className="text-xs">
                  Payment Method
                </Label>
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <SelectTrigger id="payment-method" className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} />
                          <span className="capitalize">{pm.brand}</span>
                          <span>•••• {pm.last4}</span>
                          <span className="text-xs text-muted-foreground">
                            {pm.exp_month}/{pm.exp_year}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {settings?.lastTopoffAt && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
              <CheckCircle size={16} className="mt-0.5 text-green-600" />
              <div className="flex flex-col gap-1">
                <XSmall className="font-medium">Last top-off</XSmall>
                <XSmall className="text-muted-foreground">
                  {new Date(settings.lastTopoffAt).toLocaleString()}
                </XSmall>
              </div>
            </div>
          )}
        </>
      )}
      </CardContent>
    </Card>
  );
}
