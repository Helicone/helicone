import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import PropertiesPage from "../../components/templates/properties/propertiesPage";

const Properties = () => {
  return <PropertiesPage />;
};

Properties.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Properties;
