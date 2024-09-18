import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import VaultPage from "../components/templates/vault/vaultPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import AuthLayout from "../components/layout/auth/authLayout";
import { ReactElement } from "react";

interface VaultProps {
  user: User;
}

const Vault = (props: VaultProps) => {
  const { user } = props;

  return <VaultPage />;
};

Vault.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
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
