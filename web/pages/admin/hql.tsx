import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminHql from "../../components/templates/admin/adminHql";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const AdminHqlPage = () => {
  return <AdminHql />;
};

AdminHqlPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AdminHqlPage;

export const getServerSideProps = withAdminSSR;
