import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { useState } from "react";
import { useExperiment } from "../../../../../services/hooks/prompts/experiments";
import { clsx } from "../../../../shared/clsx";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ThemedModal from "../../../../shared/themed/themedModal";
import ModelPill from "../../../requestsV2/modelPill";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { usePrompt } from "../../../../../services/hooks/prompts/prompts";
import ArrayDiffViewer from "../../id/arrayDiffViewer";
import ScoresTable from "../scoresTable";
import { SimpleTable } from "../../../../shared/table/simpleTable";
import { formatNumber } from "../../../users/initialColumns";

interface PromptIdPageProps {
  id: string;
  promptId: string;
}

const ExperimentIdPage = (props: PromptIdPageProps) => {
  const { id, promptId } = props;
  const { experiment, isLoading } = useExperiment(id);
  const { prompt, isLoading: isPromptsLoading } = usePrompt(promptId);

  const [selectedObj, setSelectedObj] = useState<{
    key: string;
    value: string;
  }>();
  const [open, setOpen] = useState(false);

  const runs = experiment?.dataset?.rows.map((row) => {
    return {
      inputs: row.inputRecord?.inputs ?? {},
      originResult: {
        response: row.inputRecord?.response,
        scores: row.scores,
      },
      testResult: {
        response: experiment?.hypotheses?.[0]?.runs?.find(
          (run) => run.datasetRowId === row.rowId
        )?.response,
        scores:
          experiment?.hypotheses?.[0]?.runs?.find(
            (run) => run.datasetRowId === row.rowId
          )?.scores ?? {},
      },
    };
  });

  const renderScoreValue = (score: {
    value: string | number;
    valueType: string;
  }) => {
    if (score.valueType === "boolean") {
      return score.value === 1 ? "true" : "false";
    }
    if (score.valueType === "string") {
      return score.value;
    }
    if (score.valueType === "number") {
      return formatNumber(score.value as number);
    }
    return score.value;
  };

  const renderPrettyInputs = (inputs: Record<string, string>, run: number) => {
    const TEXT_LIMIT = 80;
    const keys = runs?.[run]?.inputs
      ? Object.keys(runs?.[run]?.inputs).map((key) => key)
      : [];

    return (
      <div className="flex flex-col space-y-1">
        <p>{`{`}</p>

        {keys.map((key, i) => {
          const value = inputs[key];

          return (
            <>
              {value.length > TEXT_LIMIT ? (
                // show a button with truncated text
                <div key={i} className="flex flex-col pl-6 py-0.5">
                  <h3 className="text-sm font-semibold text-black">{key}:</h3>
                  <button
                    onClick={() => {
                      setSelectedObj({ key, value });
                      setOpen(true);
                    }}
                    className="ml-4 space-x-2 text-left border-sky-500 bg-sky-100 border rounded-md p-2 relative"
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4 text-sky-500 absolute top-2 right-2" />
                    <pre className="text-sm text-black truncate pr-8">
                      {value.slice(0, TEXT_LIMIT)}...
                    </pre>
                  </button>
                </div>
              ) : (
                <div key={i} className="flex space-x-2 pl-6 py-0.5">
                  <h3 className="text-sm font-semibold text-black">{key}:</h3>
                  <pre className="text-sm whitespace-pre-wrap break-words text-black truncate">
                    {value},
                  </pre>
                </div>
              )}
            </>
          );
        })}
        <p>{`}`}</p>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col w-full space-y-4">
        <HcBreadcrumb
          pages={[
            {
              href: "/prompts",
              name: "Prompts",
            },
            {
              href: `/prompts/${promptId}`,
              name: isPromptsLoading
                ? "Loading..."
                : prompt?.user_defined_id || "",
            },
            {
              href: `/prompts/${promptId}/experiments/${id}`,
              name: experiment?.id || "",
            },
          ]}
        />
        {isLoading ? (
          <div className="h-96 flex justify-center items-center w-full">
            <LoadingAnimation title="Loading Experiment Info" />
          </div>
        ) : (
          <div className="flex flex-col items-start space-y-4 w-full">
            <h1 className="font-semibold text-3xl text-black dark:text-white">
              {experiment?.id}
            </h1>
            {experiment?.scores && <ScoresTable scores={experiment?.scores} />}
            <div className="h-full w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black">
              <div className="w-full flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700 rounded-t-lg">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">Diff Viewer</p>
                </div>
              </div>
              <div className="p-4 whitespace-pre-wrap">
                <ArrayDiffViewer
                  origin={
                    (
                      experiment?.hypotheses?.[0]?.parentPromptVersion
                        ?.template as any
                    )?.messages ?? null
                  }
                  target={
                    (
                      experiment?.hypotheses?.[0]?.promptVersion
                        ?.template as any
                    )?.messages ?? null
                  }
                />
              </div>
            </div>
            <div className="w-full flex flex-col space-y-8">
              <SimpleTable
                data={runs ?? []}
                columns={[
                  {
                    key: "inputs",
                    header: "Prompt Inputs",
                    render: (value) => (
                      <div className="w-[400px]">
                        {renderPrettyInputs(
                          value.inputs,
                          runs?.indexOf(value) ?? 0
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "originResult",
                    header: "Original Output",
                    render: (run) => (
                      <div className="flex flex-col h-full w-full space-y-4">
                        <div className="w-full flex items-center gap-2">
                          <span
                            className={clsx(
                              (run.originResult.response?.delayMs ?? 0) <=
                                (run.testResult.response?.delayMs ?? 0)
                                ? "bg-green-50 text-green-700 ring-green-200"
                                : "bg-red-50 text-red-700 ring-red-200",
                              `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                            )}
                          >
                            {run.originResult.response?.delayMs} ms
                          </span>
                          <span
                            className={clsx(
                              "bg-gray-50 text-gray-700 ring-gray-200",
                              `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                            )}
                          >
                            {run.originResult.response?.promptTokens ?? 0} input
                            tokens
                          </span>
                          <span
                            className={clsx(
                              "bg-gray-50 text-gray-700 ring-gray-200",
                              `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                            )}
                          >
                            {run.originResult.response?.completionTokens ?? 0}{" "}
                            output tokens
                          </span>
                          <ModelPill
                            model={run.originResult.response?.model ?? ""}
                          />
                        </div>
                        <div className="w-full flex items-center gap-2">
                          {run.originResult.scores &&
                            Object.keys(run.originResult.scores).length > 0 && (
                              <>
                                Scores:{" "}
                                {Object.keys(run.originResult.scores).map(
                                  (key) => (
                                    <span
                                      key={key}
                                      className="bg-gray-50 text-gray-700 ring-gray-200 rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
                                    >
                                      {key}:{" "}
                                      {renderScoreValue(
                                        run.originResult.scores[key]
                                      )}
                                    </span>
                                  )
                                )}
                              </>
                            )}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm w-full h-full text-black">
                          {
                            (run.originResult.response?.body as any)
                              ?.choices?.[0]?.message?.content
                          }
                        </pre>
                      </div>
                    ),
                  },
                  {
                    key: "testResult",
                    header: "Experiment Output",
                    render: (run) => (
                      <div className="flex flex-col h-full w-full space-y-4">
                        <div className="w-full flex items-center gap-2">
                          <span
                            className={clsx(
                              (run.originResult.response?.delayMs ?? 0) >
                                (run.testResult.response?.delayMs ?? 0)
                                ? "bg-green-50 text-green-700 ring-green-200"
                                : "bg-red-50 text-red-700 ring-red-200",
                              `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                            )}
                          >
                            {run.testResult.response?.delayMs} ms
                          </span>
                          <span
                            className={clsx(
                              "bg-gray-50 text-gray-700 ring-gray-200",
                              `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                            )}
                          >
                            {run.testResult.response?.promptTokens ?? 0} input
                            tokens
                          </span>
                          <span
                            className={clsx(
                              "bg-gray-50 text-gray-700 ring-gray-200",
                              `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                            )}
                          >
                            {run.testResult.response?.completionTokens ?? 0}{" "}
                            output tokens
                          </span>
                          <ModelPill
                            model={run.testResult.response?.model ?? ""}
                          />
                        </div>
                        <div className="w-full flex items-center gap-2">
                          {run.testResult.scores &&
                            Object.keys(run.testResult.scores).length > 0 && (
                              <>
                                Scores:{" "}
                                {Object.keys(run.testResult.scores).map(
                                  (key) => (
                                    <span
                                      key={key}
                                      className="bg-gray-50 text-gray-700 ring-gray-200 rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset"
                                    >
                                      {key}:{" "}
                                      {renderScoreValue(
                                        run.testResult.scores[key]
                                      )}
                                    </span>
                                  )
                                )}
                              </>
                            )}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm w-full h-full text-black">
                          {
                            (run.testResult.response?.body as any)?.choices?.[0]
                              ?.message?.content
                          }
                        </pre>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[66vw] h-full flex flex-col space-y-4">
          <div className="flex items-center w-full justify-center">
            <h3 className="text-2xl font-semibold">{selectedObj?.key}</h3>
            <button onClick={() => setOpen(false)} className="ml-auto">
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="bg-white border-gray-300 dark:bg-black dark:border-gray-700 p-4 border rounded-lg flex flex-col space-y-4">
            <pre className="whitespace-pre-wrap text-sm w-full h-full text-black">
              {selectedObj?.value}
            </pre>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default ExperimentIdPage;
