import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PortalPage from "../../../components/templates/enterprise/portal/portalPage";

interface PortalProps {}

const Portal = (props: PortalProps) => {
  return <PortalPage />;
};

Portal.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Portal;
