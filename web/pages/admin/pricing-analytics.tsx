import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminPricingAnalytics from "../../components/templates/admin/adminPricingAnalytics";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const PricingAnalytics = () => {
  return <AdminPricingAnalytics />;
};

PricingAnalytics.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default PricingAnalytics;

export const getServerSideProps = withAdminSSR;
