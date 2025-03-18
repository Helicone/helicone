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
    <div className="flex flex-col space-y-8 bg-gray-50 dark:bg-black relative text-black dark:text-white">
      {requestBody && Object.keys(requestBody).length > 0 && (
        <div className="flex flex-col space-y-2 p-4">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-md">
            Request
          </p>
          <pre className="bg-white dark:bg-[#17191d] text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700">
            <JsonRenderer data={requestBody} />
          </pre>
        </div>
      )}
      {responseBody && Object.keys(responseBody).length > 0 && (
        <div className="flex flex-col space-y-2 p-4">
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-md">
            Response
          </p>
          <pre className="bg-white dark:bg-[#17191d] text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700">
            <JsonRenderer data={responseBody} />
          </pre>
        </div>
      )}
    </div>
  );
};
