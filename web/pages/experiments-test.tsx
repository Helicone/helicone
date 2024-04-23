import { User } from "@supabase/auth-helpers-nextjs";
import { ReactElement, useEffect, useState } from "react";
import AuthLayout from "../components/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { useJawnClient } from "../lib/clients/jawnHook";
import { useInputs } from "../services/hooks/prompts/inputs";
import {
  usePromptVersions,
  usePrompts,
} from "../services/hooks/prompts/prompts";

interface AlertProps {
  user: User;
}

const Alert = (props: AlertProps) => {
  const { user } = props;

  const [promptId, setPromptId] = useState<string>("");

  const prompts = usePrompts();
  const promptVersions = usePromptVersions(promptId);

  const [promptVersionId, setPromptVersionId] = useState<string>("");

  const inputs = useInputs(promptVersionId);

  useEffect(() => {
    if (prompts.prompts?.[0].id) {
      setPromptId(prompts.prompts?.[0].id);
    }
  }, [prompts.prompts?.[0].id]);

  useEffect(() => {
    if (promptVersions.prompts?.[0].id) {
      setPromptVersionId(promptVersions.prompts?.[0].id);
    }
  }, [promptVersions.prompts?.[0].id]);

  const jawn = useJawnClient();
  return (
    <>
      <AuthHeader title={"Alerts"} />
      <div>
        <div>Hello Scott</div>
        ENTER PROMPT ID (Default latest prompt)
        <input
          type="text"
          value={promptId}
          className="border-2 border-gray-300 p-2 w-full"
          onChange={(e) =>
            setPromptId(e.target.value === "" ? "" : e.target.value)
          }
        />
        ENTER PROMPT VERSION ID (Default latest prompt)
        <input
          type="text"
          value={promptVersionId}
          className="border-2 border-gray-300 p-2 w-full"
          onChange={(e) =>
            setPromptVersionId(e.target.value === "" ? "" : e.target.value)
          }
        />
        <button
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
          onClick={async () => {
            const requestIds = await jawn.POST(
              "/v1/prompt/version/{promptVersionId}/inputs/query",
              {
                body: {
                  limit: 2,
                  random: true,
                },
                params: {
                  path: {
                    promptVersionId: promptVersionId,
                  },
                },
              }
            );

            const dataset = await jawn.POST("/v1/experiment/dataset", {
              body: {
                datasetName: "test Set Hi Scott",
                requestIds:
                  requestIds.data?.data?.map((r) => r.source_request) ?? [],
              },
            });

            dataset.data?.data?.datasetId;

            const newSubVersion = await jawn.POST(
              "/v1/prompt/version/{promptVersionId}/subversion",
              {
                body: {
                  newHeliconeTemplate: {
                    model: "gpt-3.5-turbo",
                    messages: [
                      {
                        role: "system",
                        content:
                          '<helicone-prompt-input key="test2" />sdafsadfadsfads <helicone-prompt-input key="test" />Applsadfslaksdjlfd!',
                      },
                    ],
                  },
                },
                params: {
                  path: {
                    promptVersionId: promptVersionId,
                  },
                },
              }
            );

            jawn.POST("/v1/experiment", {
              body: {
                datasetId: dataset.data?.data?.datasetId!,
                model: "gpt-3.5-turbo",
                promptVersion: newSubVersion.data?.data?.id!,
              },
            });
          }}
        >
          Create random dataset and run experiment with that dataset
        </button>
      </div>
    </>
  );
};

Alert.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Alert;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
  } = options;

  return {
    props: {
      user,
    },
  };
});
