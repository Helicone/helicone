import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    settings?.thresholdCents
      ? (settings.thresholdCents / 100).toString()
      : "10",
  );
  const [topoffAmount, setTopoffAmount] = useState(
    settings?.topoffAmountCents
      ? (settings.topoffAmountCents / 100).toString()
      : "50",
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    settings?.stripePaymentMethodId ?? "",
  );
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "alert",
  });

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setThreshold(
        settings.thresholdCents
          ? (settings.thresholdCents / 100).toString()
          : "10",
      );
      setTopoffAmount(
        settings.topoffAmountCents
          ? (settings.topoffAmountCents / 100).toString()
          : "50",
      );
      setSelectedPaymentMethod(settings.stripePaymentMethodId ?? "");
    }
  }, [settings]);

  // Auto-select first payment method if available and none selected
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  const handleSave = async () => {
    const thresholdCents = Math.round(parseFloat(threshold || "0") * 100);
    const topoffAmountCents = Math.round(parseFloat(topoffAmount || "0") * 100);

    if (!selectedPaymentMethod) {
      setAlertDialog({
        isOpen: true,
        title: "Payment Method Required",
        description: "Please select a payment method",
        type: "alert",
      });
      return;
    }

    if (thresholdCents < 0) {
      setAlertDialog({
        isOpen: true,
        title: "Invalid Threshold",
        description: "Threshold must be non-negative",
        type: "alert",
      });
      return;
    }

    if (topoffAmountCents < 500) {
      setAlertDialog({
        isOpen: true,
        title: "Amount Too Low",
        description: "Top-off amount must be at least $5",
        type: "alert",
      });
      return;
    }

    if (topoffAmountCents > 1000000) {
      setAlertDialog({
        isOpen: true,
        title: "Amount Too High",
        description: "Top-off amount must not exceed $10,000",
        type: "alert",
      });
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
      setAlertDialog({
        isOpen: true,
        title: "Cannot Remove Payment Method",
        description:
          "Cannot remove the last payment method while auto top-off is enabled. Please disable auto top-off first.",
        type: "alert",
      });
      return;
    }

    setAlertDialog({
      isOpen: true,
      title: "Remove Payment Method",
      description: "Are you sure you want to remove this payment method?",
      type: "confirm",
      onConfirm: async () => {
        await removePaymentMethod.mutateAsync({
          params: { path: { paymentMethodId } },
        });
      },
    });
  };

  return (
    <>
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
            <Small className="font-semibold text-foreground">Auto Top-Up</Small>
            <div className="flex items-center gap-2">
              <Small className="text-muted-foreground">
                {enabled ? "Enabled" : "Disabled"}
              </Small>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={!hasPaymentMethods}
              />
            </div>
          </div>

          {/* Payment Methods Management */}
          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* Payment Method Dropdown */}
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger id="payment-method" className="w-full">
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm) => (
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

              {/* Saved Cards Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="saved-cards" className="border-none">
                  <AccordionTrigger className="w-fit justify-start py-0 pt-1 hover:no-underline">
                    <XSmall className="text-muted-foreground hover:text-foreground">
                      Saved Cards
                    </XSmall>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="flex flex-col gap-2">
                      {paymentMethods.map((pm) => (
                        <div
                          key={pm.id}
                          className="flex items-center justify-between rounded-md border border-border bg-card p-2"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard
                              size={14}
                              className="text-muted-foreground"
                            />
                            <XSmall className="font-medium">
                              <span className="capitalize">{pm.brand}</span>{" "}
                              •••• {pm.last4}
                            </XSmall>
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

                      {/* Add Card Button */}
                      <Button
                        onClick={handleAddPaymentMethod}
                        disabled={createSetupSession.isPending}
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        {createSetupSession.isPending
                          ? "Loading..."
                          : "Add Card"}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <Button
              onClick={handleAddPaymentMethod}
              disabled={createSetupSession.isPending}
              variant="outline"
              className="w-full"
            >
              {createSetupSession.isPending ? "Loading..." : "Add Card"}
            </Button>
          )}

          {!hasPaymentMethods ? (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-muted p-3">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={16}
                  className="mt-0.5 text-muted-foreground"
                />
                <div className="flex flex-col gap-1">
                  <XSmall className="font-medium">
                    No payment method found
                  </XSmall>
                  <XSmall className="text-muted-foreground">
                    Purchase credits first to save a payment method for auto
                    top-up.
                  </XSmall>
                </div>
              </div>
            </div>
          ) : (
            <>
              {settings?.consecutiveFailures >= 2 && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <AlertCircle size={16} className="mt-0.5 text-destructive" />
                  <div className="flex flex-col gap-1">
                    <XSmall className="font-medium text-destructive">
                      Payment failures detected
                    </XSmall>
                    <XSmall className="text-destructive/80">
                      Auto top-up has failed {settings.consecutiveFailures}{" "}
                      times. Please check your payment method.
                    </XSmall>
                  </div>
                </div>
              )}

              {enabled && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <Label
                        htmlFor="threshold"
                        className="whitespace-nowrap text-sm"
                      >
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
                      <Label
                        htmlFor="topoff-amount"
                        className="whitespace-nowrap text-sm"
                      >
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
                    <AlertCircle
                      size={16}
                      className="mt-0.5 text-muted-foreground"
                    />
                    <XSmall className="text-muted-foreground">
                      For your protection, auto top-up is limited to once per
                      hour.
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

    <AlertDialog
      open={alertDialog.isOpen}
      onOpenChange={(open) =>
        !open && setAlertDialog({ ...alertDialog, isOpen: false })
      }
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {alertDialog.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertDialog.type === "confirm" && (
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={
              alertDialog.type === "confirm" ? alertDialog.onConfirm : undefined
            }
          >
            {alertDialog.type === "confirm" ? "Remove" : "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
