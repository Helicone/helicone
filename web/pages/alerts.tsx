import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../components/shared/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import MetaData from "../components/shared/metaData";
import AlertsPage from "../components/templates/alerts/alertsPage";
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

  return (
    <MetaData title="Alerts">
      <AuthLayout user={user}>
        <AuthHeader title={"Alerts"} />
        <AlertsPage
          orgId={orgId}
          alerts={alert}
          refreshAlert={refreshAlert}
          alertHistory={alertHistory}
          refreshAlertHistory={refreshAlertHistory}
        />
      </AuthLayout>
    </MetaData>
  );
};

export default Alert;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, orgId },
  } = options;

  return {
    props: {
      user,
      orgId,
    },
  };
});
