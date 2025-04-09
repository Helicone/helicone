import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import PropertiesPage from "../../components/templates/properties/propertiesPage";
import { withAuthSSR } from "../../lib/api/handlerWrappers";

interface PropertiesProps {
  user: User;
}

const Properties = (props: PropertiesProps) => {
  return <PropertiesPage />;
};

Properties.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Properties;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
  } = options;

  return {
    props: {
      user,
    },
  };
});
