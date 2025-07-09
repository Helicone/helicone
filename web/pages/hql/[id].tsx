import { useRouter } from "next/router";
import HQLPage from "@/components/templates/hql/hqlPage";
import AuthLayout from "@/components/layout/auth/authLayout";
import { ReactElement } from "react";
import { $JAWN_API } from "@/lib/clients/jawn";

function HQLPageWithId() {
  const router = useRouter();
  const { id } = router.query;

  const _ = $JAWN_API.useQuery("get", "/v1/helicone-sql/saved-queries");

  return <HQLPage lastestSavedId={id as string} />;
}

HQLPageWithId.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default HQLPageWithId;
