import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  isLoading?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState(5);
  const [inputMode, setInputMode] = useState(false);
  const [inputValue, setInputValue] = useState("5");
  
  const presetAmounts = [5, 20, 100, 500];
  const MIN_AMOUNT = 5;
  const MAX_AMOUNT = 500;

  const handlePresetClick = (value: number) => {
    setAmount(value);
    setInputValue(value.toString());
    setInputMode(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "") {
      setInputValue("");
      setAmount(0);
      return;
    }
    const numValue = parseInt(value);
    if (numValue <= MAX_AMOUNT) {
      setInputValue(value);
      setAmount(numValue);
    }
  };

  const handleInputClick = () => {
    setInputMode(true);
  };

  const handleSubmit = () => {
    if (amount >= MIN_AMOUNT && amount <= MAX_AMOUNT) {
      onSubmit(amount);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="relative w-[420px] transform overflow-hidden rounded-xl border border-border bg-background animate-in fade-in zoom-in-95 duration-200"
        style={{
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Redirecting to checkout...
              </p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-5">
          <h2 
            className="text-lg font-bold tracking-wider text-foreground"
            style={{ fontFamily: "monospace" }}
          >
            ADD CREDITS
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-muted p-2 transition-all hover:bg-muted/80 active:scale-95"
            disabled={isLoading}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Amount Display */}
          <div 
            className="mb-6 cursor-text rounded-lg border border-border bg-muted/20 p-6 text-center transition-all hover:bg-muted/30"
            onClick={handleInputClick}
          >
            <div className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Amount
            </div>
            {inputMode ? (
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full bg-transparent text-center text-5xl font-bold text-foreground outline-none"
                style={{ fontFamily: "monospace" }}
                placeholder="0"
                autoFocus
              />
            ) : (
              <div 
                className="text-5xl font-bold text-foreground"
                style={{ fontFamily: "monospace" }}
              >
                ${amount}
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="mb-6 grid grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`rounded-lg px-3 py-3 text-sm font-bold transition-all active:scale-95 ${
                  amount === preset
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={{
                  fontFamily: "monospace",
                }}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Total Display */}
          <div 
            className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total (USD)</span>
              <span 
                className="text-2xl font-bold text-foreground"
                style={{ fontFamily: "monospace" }}
              >
                ${amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                fontFamily: "monospace",
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmit}
              disabled={amount < MIN_AMOUNT || amount > MAX_AMOUNT || isLoading}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold transition-all active:scale-95 ${
                amount >= MIN_AMOUNT && amount <= MAX_AMOUNT && !isLoading
                  ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted/30 text-muted-foreground"
              }`}
              style={{
                fontFamily: "monospace",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  PROCESSING...
                </span>
              ) : (
                "ADD CREDITS"
              )}
            </button>
          </div>

          {/* Min/Max Info */}
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Min: ${MIN_AMOUNT} • Max: ${MAX_AMOUNT}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;