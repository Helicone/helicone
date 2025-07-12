import { ReactElement, useEffect, useRef } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import HQLPage from "@/components/templates/hql/hqlPage";
import { $JAWN_API } from "@/lib/clients/jawn";
import Router from "next/router";

const HQL = () => {
  return <HQLPage />;
};

HQL.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default HQL;
