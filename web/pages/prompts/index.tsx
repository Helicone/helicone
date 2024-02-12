import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import PromptsPage from "../../components/templates/prompts/promptsPage";
import AuthLayout from "../../components/layout/authLayout";
import { ReactElement } from "react";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";

interface PlaygroundProps {
  user: User;
}

const Prompts = (props: PlaygroundProps) => {
  const { user } = props;

  return <PromptsPage />;
};

export default Prompts;

Prompts.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();
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
