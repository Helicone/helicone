import AdminHelixThreadsPage from "@/components/templates/admin/adminHelixThreads";
import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const Admin = () => {
  return <AdminHelixThreadsPage />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
