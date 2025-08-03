import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminStats from "../../components/templates/admin/adminStats";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

interface AdminProps {}

const Admin = () => {
  return <AdminStats />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
