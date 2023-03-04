import { CsvData } from "./requestsPage";

interface CompletionRegexProps {
  prompt_name?: string;
  prompt_regex?: string;
  response?: string;
  values: string[];
  [keys: string]: any;
}

export const CompletionRegex = (props: CompletionRegexProps) => {
  const { prompt_name, prompt_regex, response, values, keys } = props;

  return (
    <>
      <div>
        <div className="w-full flex flex-col text-left space-y-1 text-sm">
          <p>{prompt_name}:</p>
          <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[150px] max-h-[150px] overflow-auto">
            {prompt_regex}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 text-sm w-full">
        {values
          .filter((v) => keys[v] != null)
          .map((v) => (
            <div
              className="w-full flex flex-col text-left space-y-1 text-sm"
              key={v}
            >
              <p>{v}:</p>
              <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[100px] overflow-auto">
                {keys[v]}
              </p>
            </div>
          ))}
      </div>
      <div className="w-full flex flex-col text-left space-y-1 text-sm">
        <p>Response:</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-[150px] max-h-[150px] overflow-auto">
          {response}
        </p>
      </div>
    </>
  );
};
