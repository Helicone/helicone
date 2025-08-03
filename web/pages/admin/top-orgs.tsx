import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminTopOrgs from "../../components/templates/admin/adminTopOrgs";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

interface AdminProps {}

const Admin = () => {
  return <AdminTopOrgs />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
