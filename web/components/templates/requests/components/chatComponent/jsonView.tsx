import React from "react";
import { JsonRenderer } from "./single/JsonRenderer";

interface JsonViewProps {
  requestBody: any;
  responseBody: any;
}

export const JsonView: React.FC<JsonViewProps> = ({
  requestBody,
  responseBody,
}) => {
  return (
    <div className="relative flex flex-col space-y-8 bg-gray-50 text-black dark:bg-black dark:text-white">
      {requestBody && Object.keys(requestBody).length > 0 && (
        <div className="flex flex-col space-y-2 p-4">
          <p className="text-md font-semibold text-gray-900 dark:text-gray-100">
            Request
          </p>
          <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-gray-300 bg-white p-4 text-xs dark:border-gray-700 dark:bg-[#17191d]">
            <JsonRenderer data={requestBody} />
          </pre>
        </div>
      )}
      {responseBody && Object.keys(responseBody).length > 0 && (
        <div className="flex flex-col space-y-2 p-4">
          <p className="text-md font-semibold text-gray-900 dark:text-gray-100">
            Response
          </p>
          <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-gray-300 bg-white p-4 text-xs dark:border-gray-700 dark:bg-[#17191d]">
            <JsonRenderer data={responseBody} />
          </pre>
        </div>
      )}
    </div>
  );
};
