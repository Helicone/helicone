import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminHqlEnriched from "../../components/templates/admin/adminHqlEnriched";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const AIGatewayCandidates = () => {
  return <AdminHqlEnriched />;
};

AIGatewayCandidates.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AIGatewayCandidates;

export const getServerSideProps = withAdminSSR;
