import { User } from "@supabase/auth-helpers-nextjs";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";

interface AlertsPageProps {
  user: User;
  orgId: string;
  alerts: Array<[]>;
}

const AlertsPage = (props: AlertsPageProps) => {
  const { user, orgId, alerts } = props;

  console.log(alerts);

  return <div className="flex flex-col space-y-4"></div>;
};

export default AlertsPage;
