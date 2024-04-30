import { ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import { useExperiment } from "../../../../../services/hooks/prompts/experiments";
import { clsx } from "../../../../shared/clsx";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ThemedModal from "../../../../shared/themed/themedModal";
import ModelPill from "../../../requestsV2/modelPill";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { usePrompt } from "../../../../../services/hooks/prompts/prompts";

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
      },
      testResult: {
        response: experiment?.hypotheses?.[0]?.runs?.find(
          (run) => run.datasetRowId === row.rowId
        )?.response,
      },
    };
  });

  // get the keys from the first run
  const keys = runs?.[0]?.inputs
    ? Object.keys(runs?.[0]?.inputs).map((key) => key)
    : [];

  const renderPrettyInputs = (inputs: Record<string, string>) => {
    const TEXT_LIMIT = 80;

    return (
      <>
        <div className="flex flex-col space-y-1">
          <p>{`{`}</p>

          {keys.map((key, i) => {
            const value = inputs[key];

            return (
              <div key={i} className="flex space-x-2 pl-6">
                <h3 className="text-sm font-semibold text-black">{key}:</h3>
                {value.length > TEXT_LIMIT ? (
                  // show a button with truncated text
                  <button
                    onClick={() => {
                      setSelectedObj({ key, value });
                      setOpen(true);
                    }}
                    className="flex space-x-2 text-left border-sky-500 bg-sky-100 border rounded-md p-2 relative"
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4 text-sky-500 absolute top-2 right-2" />
                    <pre className="text-sm text-black">
                      {value.slice(0, TEXT_LIMIT)}...
                    </pre>
                  </button>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap text-black">
                    {value},
                  </pre>
                )}
              </div>
            );
          })}
          <p>{`}`}</p>
        </div>
      </>
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
            <div className="w-full flex flex-col space-y-8">
              <div className="p-8 rounded-lg bg-white border border-gray-300 flex flex-col space-y-4">
                <div className="grid grid-cols-4">
                  <div className="col-span-2">
                    <h2 className="text-md font-semibold">Original Prompt</h2>
                  </div>
                  <div className="col-span-2">
                    <h2 className="text-md font-semibold">Experiment Prompt</h2>
                  </div>
                </div>
                <ReactDiffViewer
                  oldValue={
                    JSON.stringify(
                      experiment?.hypotheses?.[0]?.parentPromptVersion
                        ?.template,
                      undefined,
                      4
                    ).substring(100) ?? ""
                  }
                  newValue={
                    JSON.stringify(
                      experiment?.hypotheses?.[0]?.promptVersion?.template,
                      undefined,
                      4
                    ).substring(100) ?? ""
                  }
                  splitView={true}
                />
              </div>

              <Table className="bg-white border border-gray-300 rounded-lg p-4 w-full">
                <TableHead className="border-b border-gray-300 w-full">
                  <TableRow>
                    <TableHeaderCell className="w-1/3">
                      <p className="text-black text-lg">Prompt Inputs</p>
                    </TableHeaderCell>
                    <TableHeaderCell className="w-1/3 border-l border-gray-300">
                      <p className="text-black text-lg">Original Output</p>
                    </TableHeaderCell>
                    <TableHeaderCell className="w-1/3 border-l border-gray-300">
                      <p className="text-black text-lg">Experiment Output</p>
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {runs?.map((run, i) => {
                    return (
                      <TableRow key={i} className="w-full">
                        <TableCell className="h-full items-start border-r border-gray-300">
                          {renderPrettyInputs(run.inputs)}
                        </TableCell>
                        <TableCell className="inline-flex h-full">
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
                                {run.originResult.response?.promptTokens ?? 0}{" "}
                                input tokens
                              </span>
                              <span
                                className={clsx(
                                  "bg-gray-50 text-gray-700 ring-gray-200",
                                  `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                )}
                              >
                                {run.originResult.response?.completionTokens ??
                                  0}{" "}
                                output tokens
                              </span>
                              <ModelPill
                                model={run.originResult.response?.model ?? ""}
                              />
                            </div>
                            <pre className="whitespace-pre-wrap text-sm w-full h-full text-black">
                              {
                                (run.originResult.response?.body as any)
                                  ?.choices?.[0].message.content
                              }
                            </pre>
                          </div>
                        </TableCell>

                        <TableCell className="h-full border-l border-gray-300">
                          {(run.testResult.response?.body as any)?.error ? (
                            <pre className="whitespace-pre-wrap bg-red-50 text-red-700 ring-red-200 rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset">
                              {JSON.stringify(
                                (run.testResult.response?.body as any)?.error,
                                undefined,
                                2
                              )}
                            </pre>
                          ) : (
                            <div className="flex flex-col h-full w-full space-y-4">
                              <div className="w-full flex items-center gap-2">
                                <span
                                  className={clsx(
                                    (run.originResult.response?.delayMs ?? 0) >=
                                      (run.testResult.response?.delayMs ?? 0)
                                      ? "bg-green-50 text-green-700 ring-green-200"
                                      : "bg-red-50 text-red-700 ring-red-200",
                                    `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                  )}
                                >
                                  {run.testResult.response?.delayMs ?? 0} ms
                                </span>
                                <span
                                  className={clsx(
                                    "bg-gray-50 text-gray-700 ring-gray-200",
                                    `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                  )}
                                >
                                  {run.testResult.response?.completionTokens}{" "}
                                  input tokens
                                </span>

                                <span
                                  className={clsx(
                                    "bg-gray-50 text-gray-700 ring-gray-200",
                                    `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                  )}
                                >
                                  {run.testResult.response?.promptTokens} prompt
                                  tokens
                                </span>
                                <ModelPill
                                  model={run.testResult.response?.model ?? ""}
                                />
                              </div>
                              <pre className="whitespace-pre-wrap text-sm overflow-auto h-full text-black">
                                {
                                  (run.testResult.response?.body as any) // TODO: any
                                    ?.choices?.[0].message.content
                                }
                              </pre>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
