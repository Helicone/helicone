import { ReactElement } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import GatewayPage from "@/components/templates/gateway/gatewayPage";

const Gateway = () => {
  return (
    <div className="flex flex-col">
      <GatewayPage />
    </div>
  );
};

export default Gateway;

Gateway.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
