import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import UserSearch from "../../components/templates/admin/userSearch";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const AdminUserSearchPage = () => {
  return <UserSearch />;
};

AdminUserSearchPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AdminUserSearchPage;

export const getServerSideProps = withAdminSSR;
