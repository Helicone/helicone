import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../../components/shared/layout/authLayout";
import AuthHeader from "../../components/shared/authHeader";
import MetaData from "../../components/shared/metaData";
import AlertsPage from "../../components/templates/alerts/alertsPage";
import { withAuthSSR } from "../../lib//api/handlerWrappers";
import { Database } from "../../../supabase/database.types";
import { supabaseServer } from "../../lib/supabaseServer";

interface AlertProps {
  user: User;
  // userId: string;
  orgId: string;
  alerts: Array<Database["public"]["Tables"]["alert"]["Row"]>;
  alertHistory: Array<Database["public"]["Tables"]["alert_history"]["Row"]>;
}

const Alert = (props: AlertProps) => {
  const { user, orgId, alerts, alertHistory } = props;

  return (
    <MetaData title="Alerts">
      <AuthLayout user={user}>
        <AuthHeader title={"Alerts"} />
        <AlertsPage
          user={user}
          orgId={orgId}
          alerts={alerts}
          alertHistory={alertHistory}
        />
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

  const supabase = supabaseServer;

  // Get 'alert' table from supabase using orgId
  let { data: alert } = await supabase
    .from("alert")
    .select("*")
    .eq("org_id", orgId)
    .not("soft_delete", "eq", true);

  let { data: alertHistory } = await supabase
    .from("alert_history")
    .select("*")
    .eq("org_id", orgId)
    .not("soft_delete", "eq", true);

  return {
    props: {
      user,
      userId,
      orgId,
      alerts: alert,
      alertHistory: alertHistory,
    },
  };
});
