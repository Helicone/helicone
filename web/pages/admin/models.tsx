import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminModelsPage from "../../components/templates/admin/models/adminModelsPage";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const AdminModels = () => {
  return <AdminModelsPage />;
};

AdminModels.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AdminModels;

export const getServerSideProps = withAdminSSR;
