import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../components/shared/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import MetaData from "../components/shared/metaData";
import AlertsPage from "../components/templates/alerts/alertsPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { Database } from "../../supabase/database.types";

import { useRouter } from "next/router";

interface AlertProps {
  user: User;
  // userId: string;
  orgId: string;
  orgHasOnboarded: boolean;
  alerts: Array<Database["public"]["Tables"]["alert"]["Row"]>;
  alertHistory: Array<Database["public"]["Tables"]["alert_history"]["Row"]>;
}

const Alert = (props: AlertProps) => {
  const { user, orgHasOnboarded } = props;
  // const router = useRouter();
  // if (!orgHasOnboarded) {
  //   router.push("/welcome");
  // }

  return (
    <MetaData title="Alerts">
      <AuthLayout user={user}>
        <AuthHeader title={"Alerts"} />
        <AlertsPage user={user} />
      </AuthLayout>
    </MetaData>
  );
};

export default Alert;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, userId, orgId, orgHasOnboarded },
    supabaseClient,
  } = options;

  return {
    props: {
      user,
      orgHasOnboarded,
    },
  };
});
