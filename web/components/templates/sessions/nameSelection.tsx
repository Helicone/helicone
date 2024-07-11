import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { getTimeAgo } from "../../../lib/sql/timeHelpers";
import { Col } from "../../layout/common/col";
import { clsx } from "../../shared/clsx";
import { useSessionNames } from "../../../services/hooks/sessions";
import { Row } from "../../layout/common/row";
import { Tooltip } from "@mui/material";
import { useState } from "react";

interface SessionNameSelectionProps {
  sessionIdSearch: string;
  setSessionIdSearch: (value: string) => void;
  selectedName: string;
  setSelectedName: (name: string) => void;
}

const SessionNameSelection = ({
  sessionIdSearch,
  setSessionIdSearch,
  selectedName,
  setSelectedName,
}: SessionNameSelectionProps) => {
  const names = useSessionNames(sessionIdSearch);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  return (
    <Col className="min-w-[20em] place-items-stretch rounded-lg py-3 gap-3">
      <Row className="items-center gap-2">
        <TextInput
          icon={MagnifyingGlassIcon}
          placeholder="Search session..."
          onChange={(e) => setSessionIdSearch(e.target.value)}
          value={sessionIdSearch}
        />
        <Tooltip title="View doc" placement="top" arrow>
          <a
            href="https://docs.helicone.ai/features/sessions"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-2.5 rounded-lg border border-gray-300 shadow-sm"
          >
            <DocumentTextIcon className="h-4 w-4 text-gray-500 hover:cursor-pointer" />
          </a>
        </Tooltip>
      </Row>

      <Col className="space-y-4 max-h-[70vh] overflow-y-auto">
        {names.sessions.map((name) => (
          <button
            key={name.name}
            className={clsx(
              "shadow-sm rounded-lg p-4 w-full items-start text-left border",
              selectedCard === name.name
                ? "bg-sky-100 border-sky-500 dark:bg-sky-950"
                : "hover:bg-gray-50 bg-white border-gray-300 dark:bg-black dark:border-gray-700"
            )}
            onClick={() => {
              setSelectedName(name.name);
              setSelectedCard(name.name);
            }}
          >
            <Row className="flex w-full justify-between items-center gap-2">
              {name.name === "" ? (
                <div className="text-gray-400 font-semibold text-lg mb-2">
                  Unnamed
                </div>
              ) : (
                <div className="font-semibold text-lg mb-2">{name.name}</div>
              )}

              <div className="border rounded-full border-gray-500 bg-white dark:bg-black h-6 w-6 flex items-center justify-center">
                {selectedCard === name.name && (
                  <div className="bg-sky-500 rounded-full h-4 w-4" />
                )}
              </div>
            </Row>

            <div className="text-gray-500 w-full mb-5">
              <p className="text-sm">
                Last used{" "}
                <span className="font-semibold text-sky-500">
                  {getTimeAgo(new Date(name.last_used))}
                </span>
              </p>
              <p className="text-sm">
                Created on {new Date(name.created_at).toLocaleDateString()}
              </p>
            </div>

            <Row className="flex w-full justify-between items-center">
              <p className="text-sm">
                <span className="font-bold">{name.session_count} </span>
                total sessions
              </p>
              <p className="text-sm">
                Total cost $
                <span className="font-bold">{name.total_cost.toFixed(2)}</span>
              </p>
            </Row>
          </button>
        ))}
      </Col>
    </Col>
  );
};

export default SessionNameSelection;
