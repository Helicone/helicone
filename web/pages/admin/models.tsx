import AdminModelsPage from "@/components/templates/admin/models/adminModelsPage";
import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

interface AdminModelsProps {}

const AdminModels = (props: AdminModelsProps) => {
  return <AdminModelsPage />;
};

AdminModels.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AdminModels;

export const getServerSideProps = withAdminSSR;
