import { User } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "../components/layout/auth/authLayout";
import AlertsPage from "../components/templates/alerts/alertsPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { ReactElement } from "react";
import { IslandContainer } from "@/components/ui/islandContainer";

interface AlertProps {
  user: User;
}

const Alert = (props: AlertProps) => {
  const { user } = props;

  return (
    <IslandContainer className="pt-8">
      <AlertsPage user={user} />
    </IslandContainer>
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
