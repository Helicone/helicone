import AuthLayout from "../components/layout/auth/authLayout";

import { ReactElement } from "react";
import RateLimitPage from "../components/templates/rateLimit/rateLimitPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";

const RateLimit = (props: {}) => {
  return (
    <>
      <RateLimitPage />
    </>
  );
};

RateLimit.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default RateLimit;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {},
  };
});
