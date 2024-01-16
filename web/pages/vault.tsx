import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthHeader from "../components/shared/authHeader";
import MetaData from "../components/shared/metaData";
import VaultPage from "../components/templates/vault/vaultPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface VaultProps {
  user: User;
}

const Vault = (props: VaultProps) => {
  const { user } = props;

  return (
    <MetaData title="Vault">
      {/* <AuthLayout user={user}> */}
      <AuthHeader title={"Vault"} />
      <VaultPage />
      {/* </AuthLayout> */}
    </MetaData>
  );
};

export default Vault;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
