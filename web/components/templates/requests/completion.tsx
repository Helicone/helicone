import { removeLeadingWhitespace } from "../../shared/utils/utils";

interface CompletionProps {
  request: string;

  // a completion response can be an error
  response: {
    title: string;
    text: string;
  };
}

export const Completion = (props: CompletionProps) => {
  const { request, response } = props;

  return (
    <div className="flex flex-col gap-2 w-full space-y-2 text-sm">
      <div className="w-full flex flex-col text-left space-y-1 mb-4">
        <p className="font-semibold text-gray-900 text-sm">Request</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
          {request}
        </p>
      </div>
      <div className="w-full flex flex-col text-left space-y-1 text-sm">
        <p className="font-semibold text-gray-900 text-sm">{response.title}</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
          {response && removeLeadingWhitespace(response.text)}
        </p>
      </div>
    </div>
  );
};
