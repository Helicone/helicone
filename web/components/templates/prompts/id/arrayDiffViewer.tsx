import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    return <p className="text-xs text-muted-foreground">Failed to find diff</p>;
  }

  // map the array that is longer with tie-breaker being origin
  const isOriginLonger = origin.length > target.length;
  const mappedArray = isOriginLonger ? origin : target;

  return (
    <Accordion
      type="multiple"
      className="w-full"
      defaultValue={mappedArray.map((_, i) => i.toString())}
    >
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
          <AccordionItem
            key={index}
            value={index.toString()}
            className="relative"
          >
            <AccordionTrigger className="hover:no-underline py-3 px-4 border-t border-slate-200 dark:border-slate-800">
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
                      <ArrowRightIcon className="h-4 w-4 text-foreground" />
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
                      "text-xs border border-yellow-500 text-yellow-900 dark:text-yellow-300 font-semibold bg-yellow-100 dark:bg-yellow-900 px-2 py-1 w-fit flex items-center"
                    }
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Changes
                  </div>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4">
              {originContent === targetContent ? (
                <p className="text-xs text-slate-500">No changes</p>
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
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default ArrayDiffViewer;
