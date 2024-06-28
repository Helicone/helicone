import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { getTimeAgo } from "../../../lib/sql/timeHelpers";
import { Col } from "../../layout/common/col";
import { clsx } from "../../shared/clsx";
import { useSessionNames } from "../../../services/hooks/sessions";

interface SessionNameSelectionProps {
  sessionIdSearch: string;
  setSessionIdSearch: (value: string) => void;
  selectedName: string;
  setSelectedName: (name: string) => void;
}

const SessionNameSelection = ({
  // names,
  sessionIdSearch,
  setSessionIdSearch,
  selectedName,
  setSelectedName,
}: SessionNameSelectionProps) => {
  const names = useSessionNames(sessionIdSearch);
  return (
    <Col className="min-w-[20em] items-center bg-white rounded-lg p-5 gap-3">
      <div className="text-2xl font-bold mb-4">Session Name Selection</div>
      <TextInput
        icon={MagnifyingGlassIcon}
        // value={sessionIdSearch}
        // onValueChange={(value) => setSessionIdSearch(value)}
        placeholder="Search session name..."
      />
      <Col className="space-y-4 max-h-[70vh] overflow-y-auto">
        {names.sessions.map((name) => (
          <button
            key={name.name}
            className={clsx(
              "shadow-sm rounded-lg mb-3 p-4 w-full items-start text-left border",
              selectedName === name.name ? "bg-gray-100" : "hover:bg-gray-50"
            )}
            onClick={() => setSelectedName(name.name)}
          >
            {name.name === "" ? (
              <div className="text-gray-300 font-bold">No Name</div>
            ) : (
              <div className="font-bold text-lg mb-2">{name.name}</div>
            )}
            <div className="text-gray-700">
              <h5 className="text-md font-semibold">
                Created At: {new Date(name.created_at).toLocaleDateString()}
              </h5>
              <p className="text-sm">Total Cost: {name.total_cost}</p>
              <p className="text-sm">
                Last Used: {getTimeAgo(new Date(name.last_used))}
              </p>
              <p className="text-sm">Session Count: {name.session_count}</p>
            </div>
          </button>
        ))}
      </Col>
    </Col>
  );
};

export default SessionNameSelection;
