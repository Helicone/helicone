import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";

import { AdminOnPremPage } from "@/components/templates/admin/onPrem/adminOnPrem";
import { withAdminSSR } from "../../lib/api/handlerWrappers";
interface AdminProps {}

const Admin = (props: AdminProps) => {
  return <AdminOnPremPage />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
