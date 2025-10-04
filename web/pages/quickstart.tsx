import AuthLayout from "@/components/layout/auth/authLayout";
import { ReactElement } from "react";
import QuickstartPage from "@/components/templates/quickstart/quickstartPage";
import { GetServerSidePropsContext } from "next";

const Quickstart = (_props: {}) => {
  return (
    <>
      <QuickstartPage />
    </>
  );
};

Quickstart.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Quickstart;

export const getServerSideProps = async (
  _context: GetServerSidePropsContext,
) => {
  return {
    props: {},
  };
};
