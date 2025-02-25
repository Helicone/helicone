import { CheckoutLayout } from "./CheckoutLayout";

export const TeamPlanCheckout = ({
  clientSecret,
}: {
  clientSecret: string | null;
}) => (
  <CheckoutLayout clientSecret={clientSecret} header={<></>} fullWidth={true} />
);
