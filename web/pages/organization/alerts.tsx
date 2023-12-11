import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../../components/shared/layout/authLayout";
import AuthHeader from "../../components/shared/authHeader";
import MetaData from "../../components/shared/metaData";
import AlertsPage from "../../components/templates/alerts/alertsPage";
import { withAuthSSR } from "../../lib//api/handlerWrappers";

interface AlertProps {
  user: User;
  userId: string;
  orgId: string;
  alerts: Array<[]>;
}

const Alert = (props: AlertProps) => {
  const { user, orgId, alerts } = props;

  return (
    <MetaData title="Alerts">
      <AuthLayout user={user}>
        <AuthHeader title={"Alerts"} />
        <AlertsPage user={user} orgId={orgId} alerts={alerts} />
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

  const supabase = supabaseClient.getClient();

  // Get 'alert' table from supabase using orgId
  let { data: alert, error } = await supabase
    .from("alert")
    .select("*")
    .eq("org_id", orgId);

  return {
    props: {
      user,
      userId,
      orgId,
      alerts: alert,
    },
  };
});
