import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionList,
} from "@tremor/react";
import ReactDiffViewer from "react-diff-viewer";
import RoleButton from "../../playground/new/roleButton";
import { ArrowRightIcon, EyeIcon } from "@heroicons/react/20/solid";

interface ArrayDiffViewerProps {
  origin: any[];
  target: any[];
}

const ArrayDiffViewer = (props: ArrayDiffViewerProps) => {
  const { origin, target } = props;

  if (!origin || !Array.isArray(origin) || !target || !Array.isArray(target)) {
    return <p className="text-xs text-gray-500">Failed to find diff</p>;
  }

  // map the array that is longer with tie-breaker being origin
  const isOriginLonger = origin.length > target.length;
  const mappedArray = isOriginLonger ? origin : target;

  return (
    <AccordionList>
      {mappedArray.map((_, index) => {
        const originItem = origin[index];
        const targetItem = target[index];
        const getContent = (message: any) => {
          try {
            if (typeof message.content === "string") {
              return message.content;
            } else if (Array.isArray(message.content)) {
              const text = message.content.find(
                (part: any) => part.type === "text"
              )?.text;
              if (typeof text === "string") {
                return text;
              } else {
                return JSON.stringify(message.content);
              }
            }
          } catch (e) {
            return "";
          }
        };
        const isSameRole = originItem.role === targetItem.role;
        const originContent = getContent(origin[index]);
        const targetContent = getContent(target[index]);
        return (
          <Accordion key={index} className="relative" defaultOpen={true}>
            <AccordionHeader className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              <div className="flex items-center space-x-4">
                {!isSameRole && (
                  <>
                    <RoleButton
                      role={originItem.role}
                      onRoleChange={function (
                        role: "function" | "assistant" | "user" | "system"
                      ): void {}}
                      disabled={true}
                    />
                    <div>
                      <ArrowRightIcon className="h-4 w-4 text-black dark:text-white" />
                    </div>
                  </>
                )}
                <RoleButton
                  role={targetItem.role}
                  onRoleChange={function (
                    role: "function" | "assistant" | "user" | "system"
                  ): void {}}
                  disabled={true}
                />
                {originContent !== targetContent && (
                  <div
                    className={
                      "text-xs border border-yellow-500 text-yellow-900 dark:text-yellow-300 font-semibold bg-yellow-100 dark:bg-yellow-900  px-2 py-1 w-fit flex items-center"
                    }
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Changes
                  </div>
                )}
              </div>
            </AccordionHeader>
            <AccordionBody className="leading-6">
              {originContent === targetContent ? (
                <p className="text-xs text-gray-500">No changes</p>
              ) : (
                <div className="flex flex-col mt-4 space-y-2 w-full">
                  <ReactDiffViewer
                    oldValue={originContent}
                    newValue={targetContent}
                    leftTitle={"Origin"}
                    rightTitle={"New"}
                    splitView={true}
                  />
                </div>
              )}
            </AccordionBody>
          </Accordion>
        );
      })}
    </AccordionList>
  );
};

export default ArrayDiffViewer;
