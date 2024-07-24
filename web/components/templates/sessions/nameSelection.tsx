import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { getTimeAgo } from "../../../lib/sql/timeHelpers";
import { Col } from "../../layout/common/col";
import { clsx } from "../../shared/clsx";
import { Row } from "../../layout/common/row";
import { Tooltip } from "@mui/material";
import { useState } from "react";

interface SessionNameSelectionProps {
  sessionIdSearch: string;
  setSessionIdSearch: (value: string) => void;
  sessionNames: Array<{
    name: string;
    created_at: string;
    total_cost: number;
    last_used: string;
    session_count: number;
  }>;
  selectedName: string;
  setSelectedName: (name: string) => void;
}

const SessionNameSelection = ({
  sessionIdSearch,
  setSessionIdSearch,
  sessionNames,
  selectedName,
  setSelectedName,
}: SessionNameSelectionProps) => {
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
        {sessionNames.map((seshName) => (
          <button
            key={seshName.name}
            className={clsx(
              "shadow-sm rounded-lg p-4 w-full items-start text-left border",
              selectedCard === seshName.name
                ? "bg-sky-100 border-sky-500 dark:bg-sky-950"
                : "hover:bg-gray-50 bg-white border-gray-300 dark:bg-black dark:border-gray-700"
            )}
            onClick={() => {
              setSelectedName(seshName.name);
              setSelectedCard(seshName.name);
            }}
          >
            <Row className="flex w-full justify-between items-center gap-2">
              {seshName.name === "" ? (
                <div className="text-gray-400 font-semibold text-lg mb-2">
                  Unnamed
                </div>
              ) : (
                <div className="font-semibold text-lg mb-2">
                  {seshName.name}
                </div>
              )}

              <div className="border rounded-full border-gray-500 bg-white dark:bg-black h-6 w-6 flex items-center justify-center">
                {selectedCard === seshName.name && (
                  <div className="bg-sky-500 rounded-full h-4 w-4" />
                )}
              </div>
            </Row>

            <div className="text-gray-500 w-full mb-5">
              <p className="text-sm">
                Last used{" "}
                <span className="font-semibold text-sky-500">
                  {getTimeAgo(new Date(seshName.last_used))}
                </span>
              </p>
              <p className="text-sm">
                Created on {new Date(seshName.created_at).toLocaleDateString()}
              </p>
            </div>

            <Row className="flex w-full justify-between items-center">
              <p className="text-sm">
                <span className="font-bold">{seshName.session_count} </span>
                total sessions
              </p>
              <p className="text-sm">
                Total cost $
                <span className="font-bold">
                  {seshName.total_cost.toFixed(2)}
                </span>
              </p>
            </Row>
          </button>
        ))}
      </Col>
    </Col>
  );
};

export default SessionNameSelection;
