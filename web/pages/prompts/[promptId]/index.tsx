import { GetServerSidePropsContext } from "next";

import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PromptEditor from "../../../components/templates/prompts/id/PromptEditor";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

type PageParams = {
  promptId: string;
};
export default function Page(props: PageParams) {
  return (
    <div className="h-screen w-full flex flex-col">
      <PromptEditor promptId={props.promptId} />
    </div>
  );
}
Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
export const getServerSideProps = async (
  context: GetServerSidePropsContext<PageParams>
) => {
  // VALIDATE SESSION
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

  // RETURN PROPS
  return {
    props: {
      promptId: context.params?.promptId,
    },
  };
};
