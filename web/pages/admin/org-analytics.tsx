import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import OrgAnalytics from "../../components/templates/admin/orgAnalytics";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const Admin = () => {
  return <OrgAnalytics />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
