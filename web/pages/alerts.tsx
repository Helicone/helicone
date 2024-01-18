import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../components/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import AlertsPage from "../components/templates/alerts/alertsPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { ReactElement } from "react";

interface AlertProps {
  user: User;
}

const Alert = (props: AlertProps) => {
  const { user } = props;

  return (
    <>
      <AuthHeader title={"Alerts"} />
      <AlertsPage user={user} />
    </>
  );
};

Alert.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
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
