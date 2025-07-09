import { ReactElement, useEffect, useRef } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import HQLPage from "@/components/templates/hql/hqlPage";
import { $JAWN_API } from "@/lib/clients/jawn";
import Router from "next/router";

const HQL = () => {
  const { data: savedQueries, isLoading } = $JAWN_API.useQuery(
    "get",
    "/v1/helicone-sql/saved-queries",
  );

  useEffect(() => {
    if (savedQueries?.data && savedQueries.data.length > 0) {
      Router.replace(`/hql/${savedQueries.data[0].id}`);
    }
  }, [savedQueries]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <HQLPage lastestSavedId={savedQueries?.data?.[0]?.id ?? null} />;
};

HQL.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default HQL;
