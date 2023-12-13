import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../components/shared/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import MetaData from "../components/shared/metaData";
import AlertsPage from "../components/templates/alerts/alertsPage";
<<<<<<< HEAD
import { withAuthSSR } from "../lib//api/handlerWrappers";

import {
  useAlertPage,
  useAlertHistoryPage,
} from "../components/templates/alerts/useAlertPage";

interface AlertProps {
  user: User;
  orgId: string;
}

const Alert = (props: AlertProps) => {
  const { user, orgId } = props;

  const { alert, refreshAlert } = useAlertPage(orgId);
  const { alertHistory, refreshAlertHistory } = useAlertHistoryPage(orgId);
=======
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { Database } from "../../supabase/database.types";
import { supabaseServer } from "../lib/supabaseServer";

interface AlertProps {
  user: User;
  // userId: string;
  orgId: string;
  alerts: Array<Database["public"]["Tables"]["alert"]["Row"]>;
  alertHistory: Array<Database["public"]["Tables"]["alert_history"]["Row"]>;
}

const Alert = (props: AlertProps) => {
  const { user } = props;
>>>>>>> d3ddd2aa (alert fixes)

  return (
    <MetaData title="Alerts">
      <AuthLayout user={user}>
        <AuthHeader title={"Alerts"} />
<<<<<<< HEAD
        <AlertsPage
          orgId={orgId}
          alerts={alert}
          refreshAlert={refreshAlert}
          alertHistory={alertHistory}
          refreshAlertHistory={refreshAlertHistory}
        />
=======
        <AlertsPage user={user} />
>>>>>>> d3ddd2aa (alert fixes)
      </AuthLayout>
    </MetaData>
  );
};

export default Alert;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
<<<<<<< HEAD
    userData: { user, orgId },
=======
    userData: { user, userId, orgId },
    supabaseClient,
>>>>>>> d3ddd2aa (alert fixes)
  } = options;

  return {
    props: {
      user,
<<<<<<< HEAD
      orgId,
=======
>>>>>>> d3ddd2aa (alert fixes)
    },
  };
});
