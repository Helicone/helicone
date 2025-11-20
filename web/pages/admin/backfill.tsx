import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import CostBackfiller from "../../components/templates/admin/panels/costBackfiller";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const Backfill = () => {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Cost Backfiller</h1>
      <div className="flex h-full w-full max-w-4xl flex-col space-y-4 rounded-lg bg-gray-500 p-4">
        <CostBackfiller />
      </div>
    </div>
  );
};

Backfill.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Backfill;

export const getServerSideProps = withAdminSSR;
