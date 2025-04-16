import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PropertiesPage from "../../../components/templates/properties/propertiesPage";
import { withAuthSSR } from "../../../lib/api/handlerWrappers";

interface PropertiesProps {
  user: User;
  initialPropertyKey: string;
}

const Properties = (props: PropertiesProps) => {
  const { user, initialPropertyKey } = props;

  return <PropertiesPage initialPropertyKey={initialPropertyKey} />;
};

Properties.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Properties;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
    context,
  } = options;

  const { key } = context.params as { key: string };
  const initialPropertyKey = decodeURIComponent(key);

  return {
    props: {
      user,
      initialPropertyKey,
    },
  };
});
