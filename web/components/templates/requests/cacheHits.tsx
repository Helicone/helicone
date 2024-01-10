import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { RequestMetaData } from "../../../lib/api/request/metadata";

interface CacheHitsProps {
  metadata: RequestMetaData[];
}

export const CacheHits = (props: CacheHitsProps) => {
  const { metadata } = props;
  const [show, setShow] = useState(false);

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-xs font-medium">
      <button
        className="flex flex-row w-fit items-center hover:cursor-pointer"
        onClick={() => setShow(!show)}
      >
        <p className="text-gray-500">
          {metadata.length} Cache hit{metadata.length === 1 ? "" : "s"}
        </p>
        {show ? (
          <ChevronDownIcon className="h-3 w-3 ml-1 transform rotate-180 text-gray-500 inline" />
        ) : (
          <ChevronDownIcon className="h-3 w-3 ml-1 text-gray-500 inline" />
        )}
      </button>
      {show && (
        <div className="flex flex-col space-y-1">
          {metadata.map((m) => (
            <div className="flex flex-row space-x-1" key={m.request_id}>
              <div className="text-gray-900">
                {new Date(m.cached_created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
