import { ReactElement } from "react";
import AuthLayout from "../components/layout/auth/authLayout";
import { WrappedPage } from "../components/templates/wrapped/WrappedPage";

const Wrapped = () => {
  return <WrappedPage />;
};

Wrapped.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Wrapped;
