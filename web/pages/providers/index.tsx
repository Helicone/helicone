import ProvidersPage from "@/components/providers/ProvidersPage";
import AuthLayout from "@/components/layout/auth/authLayout";
import { ReactElement } from "react";

const ProviderPageWrapper = () => {
  return <ProvidersPage />;
};

ProviderPageWrapper.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default ProviderPageWrapper;
