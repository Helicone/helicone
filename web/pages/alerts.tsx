import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../components/shared/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import MetaData from "../components/shared/metaData";
import AlertsPage from "../components/templates/alerts/alertsPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";

interface AlertProps {
  user: User;
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
    userData: { user },
  } = options;

  return {
    props: {
      user,
    },
  };
});
