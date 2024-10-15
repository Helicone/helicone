import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";

import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PromptIdPage from "../../../components/templates/prompts/id/promptIdPage";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

interface PlaygroundProps {
  user: User;
  id: string;
  page: number;
  pageSize: number;
}

const Prompts = (props: PlaygroundProps) => {
  const { user, id, page, pageSize } = props;

  return <PromptIdPage id={id} pageSize={pageSize} currentPage={page} />;
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

  // get the id from the query params
  const id = context.params?.id as string;

  const { page, page_size } = context.query;

  return {
    props: {
      initialSession: session,
      user: session.user,
      id,
      page: parseInt(page as string, 10) || 1,
      pageSize: parseInt(page_size as string, 10) || 25,
    },
  };
};
