import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminPricingMigration from "../../components/templates/admin/adminPricingMigration";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const PricingMigration = () => {
  return <AdminPricingMigration />;
};

PricingMigration.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default PricingMigration;

export const getServerSideProps = withAdminSSR;
