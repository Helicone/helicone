import { User } from "@supabase/auth-helpers-nextjs";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import WebhooksPage from "../components/templates/webhooks/webhooksPage";

interface WebhooksProps {
  user: User;
}

const Webhooks = (props: WebhooksProps) => {
  const { user } = props;

  return <WebhooksPage user={user} />;
};
Webhooks.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Webhooks;
