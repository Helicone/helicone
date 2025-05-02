import { GetServerSidePropsContext } from "next";
import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PromptEditor from "../../../components/templates/prompts/id/PromptEditor";

type PageParams = {
  promptId: string;
};
export default function Page(props: PageParams) {
  return <PromptEditor promptId={props.promptId} />;
}
Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
export const getServerSideProps = async (
  context: GetServerSidePropsContext<PageParams>
) => {
  return {
    props: {
      promptId: context.params?.promptId,
    },
  };
};
