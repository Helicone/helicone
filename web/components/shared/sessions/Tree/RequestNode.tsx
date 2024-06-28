import { TreeNodeData } from "../../../../lib/sessions/sessionTypes";
import { Col } from "../../../layout/common/col";
import { Row } from "../../../layout/common/row";
import StatusBadge from "../../../templates/requestsV2/statusBadge";
import { clsx } from "../../clsx";
import { HorizontalLine } from "./Tree";

export function RequestNode(props: {
  selectedRequestId: string;
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
}) {
  const {
    selectedRequestId,
    node,
    setCloseChildren,
    closeChildren,
    setSelectedRequestId,
  } = props;
  return (
    <div
      className={clsx(
        "relative flex flex-col  dark:bg-gray-800 rounded-md py-[8px] px-3 mb-2 w-full",
        "hover:bg-[#F0F0F0] dark:hover:bg-gray-700 hover:cursor-pointer",
        "border",
        selectedRequestId === node.trace?.request_id &&
          "bg-[#D2E2FD] bg-opacity-30"
      )}
      onClick={() =>
        node.children
          ? setCloseChildren(!closeChildren)
          : setSelectedRequestId(node.trace?.request_id ?? "")
      }
    >
      <HorizontalLine />
      <Row className="w-full">
        <span
          className={clsx(
            `font-bold mr-2 py-[2px] px-[8px] rounded text-sm bg-[#D2E2FD80] h-fit`,
            `text-[#3C82F6] bg-opacity-50 border border-[#3C82F680] border-opacity-50`
          )}
        >
          {node.name}
        </span>
        <Col className="w-full gap-5">
          <Row className="items-center flex-grow i">
            <span className="font-semibold flex-grow">
              {node.trace?.request.model}
            </span>

            <span
              className={clsx(
                "flex items-center gap-1",
                `py-[2px] px-[8px] rounded text-sm bg-[#D2E2FD80]`,
                `text-[#3C82F6] bg-opacity-50`
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M8.00016 2.66665C5.05464 2.66665 2.66683 5.05446 2.66683 7.99998C2.66683 10.9455 5.05464 13.3333 8.00016 13.3333C10.9457 13.3333 13.3335 10.9455 13.3335 7.99998C13.3335 5.05446 10.9457 2.66665 8.00016 2.66665ZM1.3335 7.99998C1.3335 4.31808 4.31826 1.33331 8.00016 1.33331C11.6821 1.33331 14.6668 4.31808 14.6668 7.99998C14.6668 11.6819 11.6821 14.6666 8.00016 14.6666C4.31826 14.6666 1.3335 11.6819 1.3335 7.99998ZM8.00016 4.66665C8.36835 4.66665 8.66683 4.96512 8.66683 5.33331V7.72384L10.4716 9.52857C10.7319 9.78892 10.7319 10.211 10.4716 10.4714C10.2112 10.7317 9.78911 10.7317 9.52876 10.4714L7.52876 8.47138C7.40373 8.34636 7.3335 8.17679 7.3335 7.99998V5.33331C7.3335 4.96512 7.63197 4.66665 8.00016 4.66665Z"
                  fill="#3C82F6"
                />
              </svg>

              {node.duration}
            </span>
          </Row>
          <Row className="items-center flex-grow ">
            <span className="flex-grow">
              {node.trace?.properties && (
                <div className="text-gray-400 dark:text-gray-400 text-sm">
                  {Object.entries(node.trace?.properties).map(
                    ([key, value], index) => (
                      <div key={index}>
                        {key}: {value}
                      </div>
                    )
                  )}
                </div>
              )}
            </span>
            {node.trace?.request.status && (
              <StatusBadge
                statusType={node.trace?.request.status.statusType}
                errorCode={node.trace?.request.status.code}
              />
            )}
          </Row>
        </Col>
      </Row>
    </div>
  );
}
