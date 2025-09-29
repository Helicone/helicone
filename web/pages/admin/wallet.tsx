import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminWallet from "../../components/templates/admin/adminWallet";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

const Wallet = () => {
  return <AdminWallet />;
};

Wallet.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Wallet;

export const getServerSideProps = withAdminSSR;
