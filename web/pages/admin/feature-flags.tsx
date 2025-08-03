import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import { AdminFeatureFlags } from "../../components/templates/admin/adminFeatureFlags";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

interface AdminProps {}

const Admin = () => {
  return <AdminFeatureFlags />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
