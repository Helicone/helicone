import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsPage from "../components/templates/requests/requestsPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { useOrg } from "../components/shared/layout/organizationContext";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { User } from "@supabase/auth-helpers-react";
import CachePage from "../components/templates/requests/CachePage";

interface CacheProps {
  user: User;
}
const Cache = (props: CacheProps) => {
  return (
    <MetaData title="Requests">
      <AuthLayout user={props.user}>
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
