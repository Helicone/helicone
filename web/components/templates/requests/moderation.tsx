import ReactJson from "react-json-pretty";
import { Json } from "../../../supabase/database.types";

interface ModerationProps {
  request?: string;
  response?: { [key: string]: Json }[];
}

const Moderation = (props: ModerationProps) => {
  const { request, response } = props;

  return (
    <div className="flex flex-col gap-2 w-full space-y-2 text-sm">
      <div className="w-full flex flex-col text-left space-y-1 mb-4">
        <p className="text-gray-500 font-medium">Request</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
          {request || "n/a"}
        </p>
      </div>
      <div className="w-full flex flex-col text-left space-y-1 text-sm">
        <p className="text-gray-500 font-medium">Response</p>
        <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
          <ReactJson data={response} />
        </p>
      </div>
    </div>
  );
};
export default Moderation;
