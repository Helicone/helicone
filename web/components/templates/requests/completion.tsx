import { CsvData } from "./requestsPage";

interface CompletionProps {
  request?: string;
  response?: string;
}

export const Completion = (props: CompletionProps) => {
  const { request, response } = props;

  return (
    <div className="flex flex-col sm:flex-row gap-4 text-sm w-full">
      <div className="w-full flex flex-col text-left space-y-1">
        <p>Request:</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[250px] max-h-[250px] overflow-auto">
          {request}
        </p>
      </div>
      <div className="w-full flex flex-col text-left space-y-1">
        <p>Response:</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[250px] max-h-[250px] overflow-auto">
          {response}
        </p>
      </div>
    </div>
  );
};
