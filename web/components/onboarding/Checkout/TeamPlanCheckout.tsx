import { CheckoutLayout } from "./CheckoutLayout";
import { Users2 } from "lucide-react";

export const TeamPlanCheckout = ({
  clientSecret,
}: {
  clientSecret: string | null;
}) => (
  <CheckoutLayout clientSecret={clientSecret} header={<></>} fullWidth={true} />
);
