import { LLMRequestBody } from "@/packages/llm-mapper/types";
import { GetServerSidePropsContext } from "next";
import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PromptEditor from "../../../components/templates/prompts/id/PromptEditor";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

const defaultBasePrompt = {
  body: {
    model: "gpt-4o-mini",
    messages: [
      {
        _type: "message",
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        _type: "message",
        role: "user",
        content: 'What is 2+<helicone-prompt-input key="number" />?',
      },
    ],
  } as LLMRequestBody,
  metadata: {
    provider: "OPENAI",
    createdFromUi: false,
    inputs: {
      number: "2",
    },
  },
};

export default function Page() {
  return <PromptEditor basePrompt={defaultBasePrompt} />;
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
export const getServerSideProps = async (
  context: GetServerSidePropsContext
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
    props: {},
  };
};
