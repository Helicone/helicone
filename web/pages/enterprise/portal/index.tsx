import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PortalPage from "../../../components/templates/enterprise/portal/portalPage";

const Portal = () => {
  return <PortalPage />;
};

Portal.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Portal;
