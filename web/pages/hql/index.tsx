import { ReactElement, useEffect, useRef } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import HQLPage from "@/components/templates/hql/hqlPage";
import { $JAWN_API } from "@/lib/clients/jawn";
import Router from "next/router";

const HQL = () => {
  const lastestSavedId = useRef<string | null>(null);

  useEffect(() => {
    const fetchSavedQueries = async () => {
      const { data: savedQueries } = await $JAWN_API.GET(
        "/v1/helicone-sql/saved-queries",
      );

      if (savedQueries?.data && savedQueries.data.length > 0) {
        lastestSavedId.current = savedQueries.data[0].id;
        Router.replace(`/hql/${lastestSavedId.current}`);
      }
    };

    fetchSavedQueries();
  }, []);

  return <HQLPage lastestSavedId={lastestSavedId.current} />;
};

HQL.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default HQL;
