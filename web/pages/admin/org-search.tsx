import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import OrgSearch from "../../components/templates/admin/orgSearch";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const Admin = () => {
  return <OrgSearch />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAdminSSR;
