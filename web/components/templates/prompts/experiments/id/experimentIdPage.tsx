import {
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import { useExperiment } from "../../../../../services/hooks/prompts/experiments";
import { clsx } from "../../../../shared/clsx";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ThemedModal from "../../../../shared/themed/themedModal";
import ModelPill from "../../../requestsV2/modelPill";

interface PromptIdPageProps {
  id: string;
}

const ExperimentIdPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { experiment, isLoading } = useExperiment(id);
  const [selectedObj, setSelectedObj] = useState<{
    key: string;
    value: string;
  }>();
  const [open, setOpen] = useState(false);

  const runs = experiment?.datasetRuns;

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
        <Link
          className="flex w-fit items-center text-gray-500 space-x-2 hover:text-gray-700"
          href={"/prompts?tab=1"}
        >
          <ChevronLeftIcon className="h-4 w-4 inline" />
          <span className="text-sm font-semibold">Experiments</span>
        </Link>
        {isLoading ? (
          <div className="h-96 flex justify-center items-center w-full">
            <LoadingAnimation title="Loading Experiment Info" />
          </div>
        ) : (
          <div className="flex flex-col items-start space-y-4 w-full">
            <h1 className="font-semibold text-3xl text-black dark:text-white">
              {experiment?.name}
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
                    experiment?.originPrompt.heliconeTemplate.messages?.[0]
                      ?.content
                  }
                  newValue={
                    experiment?.testPrompt.heliconeTemplate.messages?.[0]
                      ?.content
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
                  {experiment?.datasetRuns.map((run, i) => {
                    return (
                      <TableRow key={i} className="w-full">
                        <TableCell className="h-full items-start border-r border-gray-300">
                          {renderPrettyInputs(run.inputs)}
                          {/* {JSON.stringify(run.inputs, undefined, 2)} */}
                        </TableCell>
                        <TableCell className="inline-flex h-full">
                          <div className="flex flex-col h-full w-full space-y-4">
                            <div className="w-full flex items-center gap-2">
                              <span
                                className={clsx(
                                  run.originResult.delay <= run.testResult.delay
                                    ? "bg-green-50 text-green-700 ring-green-200"
                                    : "bg-red-50 text-red-700 ring-red-200",
                                  `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                )}
                              >
                                {run.originResult.delay} ms
                              </span>
                              <span
                                className={clsx(
                                  "bg-gray-50 text-gray-700 ring-gray-200",
                                  `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                )}
                              >
                                {
                                  run.originResult.responseBody?.usage
                                    .total_tokens
                                }{" "}
                                total tokens
                              </span>
                              <ModelPill
                                model={run.originResult.responseBody?.model}
                              />
                            </div>
                            <pre className="whitespace-pre-wrap text-sm w-full h-full text-black">
                              {
                                run.originResult.responseBody?.choices?.[0]
                                  .message.content
                              }
                            </pre>
                          </div>
                        </TableCell>

                        <TableCell className="h-full border-l border-gray-300">
                          {run.testResult.responseBody?.error ? (
                            <pre className="whitespace-pre-wrap bg-red-50 text-red-700 ring-red-200 rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset">
                              {JSON.stringify(
                                run.testResult.responseBody.error,
                                undefined,
                                2
                              )}
                            </pre>
                          ) : (
                            <div className="flex flex-col h-full w-full space-y-4">
                              <div className="w-full flex items-center gap-2">
                                <span
                                  className={clsx(
                                    run.originResult.delay >=
                                      run.testResult.delay
                                      ? "bg-green-50 text-green-700 ring-green-200"
                                      : "bg-red-50 text-red-700 ring-red-200",
                                    `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                  )}
                                >
                                  {run.testResult.delay} ms
                                </span>
                                <span
                                  className={clsx(
                                    "bg-gray-50 text-gray-700 ring-gray-200",
                                    `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                                  )}
                                >
                                  {
                                    run.testResult.responseBody?.usage
                                      ?.total_tokens
                                  }{" "}
                                  tokens
                                </span>
                                <ModelPill
                                  model={run.testResult.responseBody?.model}
                                />
                              </div>
                              <pre className="whitespace-pre-wrap text-sm overflow-auto h-full text-black">
                                {
                                  run.testResult.responseBody?.choices?.[0]
                                    .message.content
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
