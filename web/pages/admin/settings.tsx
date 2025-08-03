import AdminSettings from "@/components/templates/admin/adminSettings";
import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

interface AdminProps {}

const Admin = () => {
  return <AdminSettings />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
