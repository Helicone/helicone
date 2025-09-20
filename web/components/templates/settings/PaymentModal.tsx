import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import ThemedModal from "../../shared/themed/themedModal";
import { clsx } from "../../shared/clsx";
import { useCreateCheckoutSession } from "../../../services/hooks/useCredits";
import useNotification from "../../shared/notification/useNotification";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const createCheckoutSession = useCreateCheckoutSession();
  const { setNotification } = useNotification();

  const presetAmounts = [5, 20, 100, 500];
  const MIN_AMOUNT = 5;
  const PERCENT_FEE_RATE = 0.03;
  const FIXED_FEE_CENTS = 30;

  const creditsAmountCents = Math.round(amount * 100);
  const percentageFeeCents = Math.round(creditsAmountCents * PERCENT_FEE_RATE);
  const stripeFeeCents =
    amount >= MIN_AMOUNT ? percentageFeeCents + FIXED_FEE_CENTS : percentageFeeCents + FIXED_FEE_CENTS;
  const totalDueCents = creditsAmountCents + stripeFeeCents;

  const formatCurrency = (cents: number) => (cents / 100).toFixed(2);

  const handlePresetClick = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(value);

    if (value === "") {
      setAmount(5);
      return;
    }

    const numValue = parseInt(value, 10);
    if (numValue >= MIN_AMOUNT) {
      setAmount(numValue);
    }
  };

  const handleSubmit = async () => {
    if (amount >= MIN_AMOUNT) {
      try {
        await createCheckoutSession.mutateAsync({ body: { amount } });
      } catch (error) {
        setNotification("Failed to start checkout. Please try again.", "error");
      }
    }
  };

  return (
    <ThemedModal open={isOpen} setOpen={onClose}>
      <div className="relative flex w-[420px] flex-col">
        {/* Loading Overlay */}
        {createCheckoutSession.isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Redirecting to checkout...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold tracking-wider text-foreground"
            style={{ fontFamily: "monospace" }}
          >
            ADD CREDITS
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-4">
          {/* Amount Display */}
          <div className="rounded-lg border border-border bg-muted/20 p-6 text-center">
            <div className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Credits
            </div>
            <div
              className="text-5xl font-bold text-foreground"
              style={{ fontFamily: "monospace" }}
            >
              ${amount}
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={clsx(
                  "rounded-lg px-3 py-3 text-sm font-bold transition-all active:scale-95",
                  amount === preset && !customAmount
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
                style={{
                  fontFamily: "monospace",
                }}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Or enter custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                $
              </span>
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-border bg-muted/20 py-3 pl-8 pr-3 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:bg-muted/30"
                style={{
                  fontFamily: "monospace",
                }}
              />
              {customAmount && parseInt(customAmount, 10) < MIN_AMOUNT && (
                <div className="mt-1 text-xs text-destructive">
                  Minimum amount is ${MIN_AMOUNT}
                </div>
              )}
            </div>
          </div>

          {/* Total Display */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Credits</span>
              <span className="text-foreground">${amount.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Stripe fee (3% + $0.30)</span>
              <span className="text-foreground">
                ${formatCurrency(stripeFeeCents)}
              </span>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Total due
                </span>
                <span
                  className="text-2xl font-bold text-foreground"
                  style={{ fontFamily: "monospace" }}
                >
                  ${formatCurrency(totalDueCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex w-full justify-end gap-4">
            <button
              onClick={onClose}
              disabled={createCheckoutSession.isPending}
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={amount < MIN_AMOUNT || createCheckoutSession.isPending}
              className={clsx(
                "relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white",
                amount >= MIN_AMOUNT && !createCheckoutSession.isPending
                  ? "bg-primary hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted/30",
              )}
            >
              {createCheckoutSession.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Add Credits"
              )}
            </button>
          </div>

          {/* Min Info */}
          <div className="text-center text-xs text-muted-foreground">
            Min: ${MIN_AMOUNT} (fees calculated separately)
          </div>
        </div>
      </div>
    </ThemedModal>
  );
};

export default PaymentModal;
