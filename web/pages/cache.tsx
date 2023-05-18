import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";

import { withAuthSSR } from "../lib/api/handlerWrappers";
import { User } from "@supabase/auth-helpers-react";
import AuthHeader from "../components/shared/authHeader";
// import CachePage from "../components/templates/requests/CachePage";
import CachePage from "../components/templates/cache/cachePage";

interface CacheProps {
  user: User;
}
const Cache = (props: CacheProps) => {
  return (
    <MetaData title="Requests">
      <AuthLayout user={props.user}>
        <AuthHeader title={"Cache"} />
        <CachePage />
      </AuthLayout>
    </MetaData>
  );
};

export default Cache;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {
      user: options.userData.user,
    },
  };
});
