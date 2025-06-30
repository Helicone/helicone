import { HeliconeUser } from "@/packages/common/auth/types";
import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import { GetServerSidePropsContext } from "next";
import HQLPage from "../components/templates/hql/hqlPage";

interface HQLProps {
  user: HeliconeUser;
}

const HQL = (props: HQLProps) => {
  const { user } = props;

  return <HQLPage user={user} />;
};

HQL.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default HQL;
