import { HeliconeUser } from "@/packages/common/auth/types";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import { GetServerSidePropsContext } from "next";
import HQLPage from "../components/templates/hql/hqlPage";

const HQL = () => {
  return <HQLPage />;
};

HQL.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default HQL;
