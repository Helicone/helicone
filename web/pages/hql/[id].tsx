import { useRouter } from "next/router";
import HQLPage from "@/components/templates/hql/hqlPage";
import AuthLayout from "@/components/layout/auth/authLayout";
import { ReactElement } from "react";

function HQLPageWithId() {
  const router = useRouter();
  const { id } = router.query;

  return <HQLPage lastestSavedId={id as string} />;
}

HQLPageWithId.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default HQLPageWithId;
