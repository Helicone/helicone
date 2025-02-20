import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  { betas: ["custom_checkout_beta_5"] }
);

export const CheckoutLayout = ({
  clientSecret,
  header,
  leftPanel,
  fullWidth = false,
}: {
  clientSecret: string | null;
  header: React.ReactNode;
  leftPanel?: React.ReactNode;
  fullWidth?: boolean;
}) => (
  <div className="flex flex-col space-y-8">
    {header}

    <div className={`flex flex-col ${fullWidth ? "" : "md:flex-row"} gap-8`}>
      {leftPanel && (
        <div className="w-full md:w-[400px] md:sticky md:top-6 h-fit">
          {leftPanel}
        </div>
      )}

      <div className={`${fullWidth ? "w-full" : "flex-1"}`}>
        {clientSecret && (
          <EmbeddedCheckoutProvider
            key={clientSecret}
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout className="h-[600px] w-full bg-white" />
          </EmbeddedCheckoutProvider>
        )}
      </div>
    </div>
  </div>
);
