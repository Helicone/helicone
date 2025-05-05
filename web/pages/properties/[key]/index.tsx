import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PropertiesPage from "../../../components/templates/properties/propertiesPage";
import { withAuthSSR } from "../../../lib/api/handlerWrappers";

interface PropertiesProps {
  initialPropertyKey: string;
}

const Properties = (props: PropertiesProps) => {
  const { initialPropertyKey } = props;

  return <PropertiesPage initialPropertyKey={initialPropertyKey} />;
};

Properties.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Properties;

export const getServerSideProps = withAuthSSR(async (options) => {
  const { context } = options;

  const { key } = context.params as { key: string };
  const initialPropertyKey = decodeURIComponent(key);

  return {
    props: {
      initialPropertyKey,
    },
  };
});
