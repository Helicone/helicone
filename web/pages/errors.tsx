import { User } from "@supabase/auth-helpers-react";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import ErrorPage from "../components/templates/requests/ErrorPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";

interface ErrorProps {
  user: User;
}
const Errors = (props: ErrorProps) => {
  return (
    <MetaData title="Requests">
      <AuthLayout user={props.user}>
        <ErrorPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Errors;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {
      user: options.userData.user,
    },
  };
});
