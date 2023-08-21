import { removeLeadingWhitespace } from "../../shared/utils/utils";
import Hover from "./hover";

interface CompletionRegexProps {
  prompt_name?: string;
  prompt_regex?: string;
  response?: string;
  values: string[];
  [keys: string]: any;
}

export const CompletionRegex = (props: CompletionRegexProps) => {
  const { prompt_name, prompt_regex, response, values, keys } = props;

  const formatPrompt = (prompt: string): JSX.Element => {
    const missingValues: string[] = [];
    let formattedString = prompt;
    const elements = formattedString
      .split(/({{[^}]+}})/g)
      .map((part, index) => {
        const match = part.match(/{{([^}]+)}}/);
        if (match) {
          const key = match[1];
          const value = keys[key];
          if (value === undefined) {
            missingValues.push(key);
            return part;
          }
          return <Hover key={`${key}-${index}`} value={value} name={key} />;
        }
        return part;
      });

    return (
      <div className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap overflow-auto">
        {elements}
      </div>
    );
  };

  return (
    <div className="flex flex-col text-left space-y-2 text-sm">
      {prompt_regex && (
        <div className="flex flex-col text-left space-y-1 leading-6 mb-4">
          <p className="text-gray-500 font-medium">Request</p>
          {formatPrompt(removeLeadingWhitespace(prompt_regex))}
        </div>
      )}

      {response && (
        <div className="flex flex-col text-left space-y-1 ">
          <p className="text-gray-500 font-medium">Response</p>
          <div className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap overflow-auto leading-6">
            {removeLeadingWhitespace(response)}
          </div>
        </div>
      )}
    </div>
  );
};
