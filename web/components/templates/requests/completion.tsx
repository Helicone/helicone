import { CsvData } from "./requestsPage";

interface CompletionProps {
  request?: string;
  response?: string;
}

export const Completion = (props: CompletionProps) => {
  const { request, response } = props;

  return (
    <div className="flex flex-col gap-2 text-xs w-full space-y-2">
      <div className="w-full flex flex-col text-left space-y-1">
        <p className="text-gray-500 font-medium">Request</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full max-h-[300px] overflow-auto">
          {request}
        </p>
      </div>
      <div className="w-full flex flex-col text-left space-y-1">
        <p className="text-gray-500 font-medium">Response</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full max-h-[300px] overflow-auto">
          {response}
        </p>
      </div>
    </div>
  );
};
