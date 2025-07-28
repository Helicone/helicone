import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  { betas: ["custom_checkout_beta_5"] },
);

export const CheckoutLayout = ({
  clientSecret,
  header,
  leftPanel,
  fullWidth = false,
  children,
}: {
  clientSecret: string | null;
  header: React.ReactNode;
  leftPanel?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}) => {
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(!!clientSecret);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (clientSecret) {
      // Show loading immediately
      setIsLoading(true);
      setShouldMount(false);

      // Wait a bit before mounting new checkout
      const timer = setTimeout(() => {
        setKey((k) => k + 1);
        setShouldMount(true);
        setIsLoading(false);
      }, 50);

      return () => {
        clearTimeout(timer);
        setShouldMount(false);
      };
    }
  }, [clientSecret]);

  return (
    <div className="flex flex-col gap-8">
      {header}

      <div className={`flex flex-col ${fullWidth ? "" : "md:flex-row"} gap-8`}>
        {leftPanel && (
          <div className="h-fit w-full md:sticky md:top-6 md:w-[400px]">
            {leftPanel}
          </div>
        )}

        <div className={`${fullWidth ? "w-full" : "flex-1"}`}>
          {children}
          {clientSecret && (
            <>
              {isLoading && (
                <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[hsl(var(--primary))]"></div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Initializing checkout...
                    </p>
                  </div>
                </div>
              )}
              {shouldMount && (
                <EmbeddedCheckoutProvider
                  key={`provider-${key}`}
                  stripe={stripePromise}
                  options={{ clientSecret }}
                >
                  <EmbeddedCheckout
                    key={`checkout-${key}`}
                    className="h-[600px] w-full bg-[hsl(var(--card))]"
                  />
                </EmbeddedCheckoutProvider>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
