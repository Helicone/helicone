import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminProjections from "../../components/templates/admin/adminProjections";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const Admin = () => {
  return <AdminProjections />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
