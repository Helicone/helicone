import AuthLayout from "../components/layout/auth/authLayout";
import { ReactElement } from "react";
import RateLimitPage from "../components/templates/rateLimit/rateLimitPage";
import { GetServerSidePropsContext } from "next";

const RateLimit = () => {
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
  _context: GetServerSidePropsContext,
) => {
  return {
    props: {},
  };
};
