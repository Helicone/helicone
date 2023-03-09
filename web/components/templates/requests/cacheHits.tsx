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
    <div className="mt-2 w-full flex flex-col text-left space-y-1 text-xs">
      <div className="flex flex-row " onClick={() => setShow(!show)}>
        <div>{metadata.length} Cache hits</div>
        {show ? (
          <ChevronDownIcon className="h-4 w-4 ml-1 transform rotate-180" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 ml-1" />
        )}
      </div>
      {show && (
        <div className="flex flex-col space-y-1">
          {metadata.map((m) => (
            <div className="flex flex-row space-x-1" key={m.request_id}>
              <div className="text-gray-500">
                {new Date(m.cached_created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
