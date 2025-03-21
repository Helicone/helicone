import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import MonitoringPage from "../../components/templates/monitoring/MonitoringPage";
import "../../components/templates/monitoring/store/monitoringConfigStore";

interface MonitoringProps {
  user: User;
  timeFilter: {
    start: string | null;
    end: string | null;
  };
}

const Monitoring = (props: MonitoringProps) => {
  return <MonitoringPage />;
};

Monitoring.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Monitoring;

export const getServerSideProps = withAuthSSR(async (options) => {
  const { start, end } = options.context.query;

  return {
    props: {
      user: options.userData.user,
      timeFilter: {
        start: start ? (start as string) : null,
        end: end ? (end as string) : null,
      },
    },
  };
});
