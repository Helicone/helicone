import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminMetrics from "../../components/templates/admin/adminMetrics";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

interface AdminProps {}

const Admin = () => {
  return <AdminMetrics />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
