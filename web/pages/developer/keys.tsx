import { NextPageWithLayout } from "../_app";
import AuthLayout from "../../components/layout/auth/authLayout";
import { ReactElement } from "react";
import DeveloperPage from "../../components/templates/developer/developerPage";
import KeyPage from "../../components/templates/keys/keyPage";

const DeveloperKeys: NextPageWithLayout = () => {
  return (
    <DeveloperPage title="Developer Keys">
      <KeyPage />
    </DeveloperPage>
  );
};

DeveloperKeys.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default DeveloperKeys;
