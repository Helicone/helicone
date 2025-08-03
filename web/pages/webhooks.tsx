import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import WebhooksPage from "../components/templates/webhooks/webhooksPage";

const Webhooks = () => {
  return <WebhooksPage />;
};
Webhooks.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Webhooks;
