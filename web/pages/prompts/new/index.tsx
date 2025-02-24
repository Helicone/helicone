import { LLMRequestBody } from "@/packages/llm-mapper/types";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { ReactElement, useEffect, useState } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import LoadingAnimation from "../../../components/shared/loadingAnimation";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import {
  useCreatePrompt,
  usePrompts,
} from "../../../services/hooks/prompts/prompts";

export default function Page() {
  const router = useRouter();
  const { prompts, isLoading } = usePrompts();
  const { createPrompt, isCreating } = useCreatePrompt();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkAndCreatePrompt = async () => {
      if (!isLoading && !isCreating && !isRedirecting) {
        if (!prompts || prompts.length === 0) {
          // No prompts exist, create a default one
          try {
            setIsRedirecting(true);

            // Create a basic prompt with default settings
            const basePrompt: LLMRequestBody = {
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
            };

            const metadata = {
              provider: "OPENAI",
              createdFromUi: true,
            };

            const res = await createPrompt(basePrompt, metadata);
            if (res?.id) {
              router.push(`/prompts/${res.id}`);
            }
          } catch (error) {
            console.error("Error creating prompt:", error);
            setIsRedirecting(false);
          }
        } else {
          // Prompts exist, redirect to the PromptEditor with no specific prompt
          setIsRedirecting(true);
          router.push(`/prompts/${prompts[0].id}`);
        }
      }
    };

    checkAndCreatePrompt();
  }, [isLoading, prompts, createPrompt, router, isCreating, isRedirecting]);

  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingAnimation title="Preparing your prompt editor..." />
    </div>
  );
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
