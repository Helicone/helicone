import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../components/shared/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import MetaData from "../components/shared/metaData";
import AlertsPage from "../components/templates/alerts/alertsPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { Database } from "../../supabase/database.types";

interface AlertProps {
  user: User;
  // userId: string;
  orgId: string;
  alerts: Array<Database["public"]["Tables"]["alert"]["Row"]>;
  alertHistory: Array<Database["public"]["Tables"]["alert_history"]["Row"]>;
}

const Alert = (props: AlertProps) => {
  const { user } = props;

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
    userData: { user, userId, orgId },
    supabaseClient,
  } = options;

  return {
    props: {
      user,
    },
  };
});
