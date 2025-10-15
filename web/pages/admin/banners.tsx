import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AlertBanners from "../../components/templates/admin/panels/alertBanners";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const Banners = () => {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Alert Banners</h1>
      <div className="flex h-full w-full max-w-4xl flex-col space-y-4 rounded-lg bg-gray-500 p-4">
        <AlertBanners />
      </div>
    </div>
  );
};

Banners.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Banners;

export const getServerSideProps = withAdminSSR;
