import AuthLayout from "../components/layout/auth/authLayout";
import { ReactElement } from "react";
import RateLimitPage from "../components/templates/rateLimit/rateLimitPage";
import { GetServerSidePropsContext } from "next";

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

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  return {
    props: {},
  };
};
