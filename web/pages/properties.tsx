import { User } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/layout/auth/authLayout";
import PropertiesPage from "../components/templates/properties/propertiesPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { ReactElement } from "react";

interface PropertiesProps {}

const Properties = (props: PropertiesProps) => {
  return <PropertiesPage />;
};

Properties.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Properties;
