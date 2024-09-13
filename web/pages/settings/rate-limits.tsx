import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import RateLimitPage from "../../components/templates/settings/rateLimitPage";

const RateLimitSettings: NextPageWithLayout = () => {
  return <RateLimitPage />;
};

RateLimitSettings.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default RateLimitSettings;
