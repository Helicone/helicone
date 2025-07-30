import AuthLayout from "@/components/layout/auth/authLayout";
import GatewayRouterDetails from "@/components/templates/gateway/gatewayRouterDetails";

const GatewayRouterPage = () => {
  return <GatewayRouterDetails />;
};

GatewayRouterPage.getLayout = (page: React.ReactNode) => {
  return <AuthLayout>{page}</AuthLayout>;
};

export default GatewayRouterPage;
