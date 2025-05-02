import AuthLayout from "../components/layout/auth/authLayout";
import AlertsPage from "../components/templates/alerts/alertsPage";
import { ReactElement } from "react";

interface AlertProps {}

const Alert = (props: AlertProps) => {
  return <AlertsPage />;
};

Alert.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Alert;
