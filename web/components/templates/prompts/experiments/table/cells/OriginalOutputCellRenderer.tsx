import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PromptPlayground from "../../../id/promptPlayground";
import { ScrollArea } from "@/components/ui/scroll-area";

import clsx from "clsx";
import { useExperimentRequestData } from "../hooks/useExperimentTable";

export const OriginalOutputCellRenderer = ({
  requestId,
  prompt,
  wrapText,
}: {
  requestId: string;
  prompt?: any;
  wrapText: boolean;
}) => {
  const { requestsData, isRequestsLoading } =
    useExperimentRequestData(requestId);
  const [showPromptPlayground, setShowPromptPlayground] = useState(false);

  // const content = requestsData?.responseBody;
  const content = useMemo(() => {
    const message = requestsData?.responseBody?.response?.choices?.[0]?.message;

    if (message?.content) {
      return message.content;
    }

    // If there are tool calls, extract the content from the arguments
    if (message?.tool_calls && message.tool_calls.length > 0) {
      let extractedContent = "";
      for (const toolCall of message.tool_calls) {
        if (toolCall.function?.arguments) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            // If the content is in args.content
            if (args.content) {
              extractedContent += args.content + "\n";
            }
            // If there's an array of titles in args.titles
            if (args.titles && Array.isArray(args.titles)) {
              extractedContent += args.titles.join("\n") + "\n";
            }
            // Add any other properties you need to extract here
          } catch (e) {
            console.error("Failed to parse tool call arguments:", e);
            continue;
          }
        }
      }
      return extractedContent.trim();
    }

    return "";
  }, [requestsData]);

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  const formatPromptForPlayground = (): any => {
    return {
      model: prompt?.model || "",
      messages: [
        ...(prompt?.helicone_template?.messages || []),
        {
          role: "assistant",
          content: content,
        },
      ],
    };
  };

  return (
    <Popover open={showPromptPlayground} onOpenChange={setShowPromptPlayground}>
      <PopoverTrigger asChild>
        <div
          className={`w-full h-full items-center flex ${
            content ? "justify-start" : "justify-end"
          }`}
          onClick={handleCellClick}
        >
          {content ? (
            <div className={clsx(wrapText && "whitespace-pre-wrap")}>
              {content}
            </div>
          ) : (
            <div>
              <Button
                variant="ghost"
                className="w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500"
                onClick={(e) => {
                  e.stopPropagation();
                  // params.handleRunHypothesis("original", [
                  //   {
                  //     cellId: cellData.cellId,
                  //     columnId: colDef.cellRendererParams.columnId,
                  //   },
                  // ]);
                }}
              >
                <PlayIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
        <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh]">
          <PromptPlayground
            prompt={formatPromptForPlayground() || ""}
            selectedInput={undefined}
            onSubmit={(history, model) => {
              setShowPromptPlayground(false);
            }}
            submitText="Save"
            initialModel={prompt?.model || ""}
            isPromptCreatedFromUi={false}
            defaultEditMode={false}
            editMode={false}
            playgroundMode="experiment"
            chatType="response"
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

// export const OriginalOutputCellRenderer: React.FC<any> = (params) => {
//   const { data, prompt, wrapText } = params;
//   const [showPromptPlayground, setShowPromptPlayground] = useState(false);

//   const content = useMemo(() => {
//     const message = cellData?.value?.response?.choices?.[0]?.message;

//     // If there's direct content, use it
//     if (message?.content) {
//       return message.content;
//     }

//     // If there are tool calls, extract the content from the arguments
//     if (message?.tool_calls && message.tool_calls.length > 0) {
//       let extractedContent = "";
//       for (const toolCall of message.tool_calls) {
//         if (toolCall.function?.arguments) {
//           try {
//             const args = JSON.parse(toolCall.function.arguments);
//             // If the content is in args.content
//             if (args.content) {
//               extractedContent += args.content + "\n";
//             }
//             // If there's an array of titles in args.titles
//             if (args.titles && Array.isArray(args.titles)) {
//               extractedContent += args.titles.join("\n") + "\n";
//             }
//             // Add any other properties you need to extract here
//           } catch (e) {
//             console.error("Failed to parse tool call arguments:", e);
//             continue;
//           }
//         }
//       }
//       return extractedContent.trim();
//     }

//     return "";
//   }, [cellData]);

//   const handleCellClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setShowPromptPlayground(true);
//   };

//   const formatPromptForPlayground = (): any => {
//     return {
//       model: prompt?.model || "",
//       messages: [
//         ...(prompt?.helicone_template?.messages || []),
//         {
//           role: "assistant",
//           content: content,
//         },
//       ],
//     };
//   };

//   if (cellData?.status === "running") {
//     return (
//       <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
//         <span className="animate-ping inline-flex rounded-full bg-green-700 h-2 w-2"></span>
//         <div className="italic">Generating...</div>
//       </div>
//     );
//   }

//   return (
//     <Popover open={showPromptPlayground} onOpenChange={setShowPromptPlayground}>
//       <PopoverTrigger asChild>
//         <div
//           className={`w-full h-full items-center flex ${
//             content ? "justify-start" : "justify-end"
//           }`}
//           onClick={handleCellClick}
//         >
//           {content ? (
//             <div className={clsx(wrapText && "whitespace-pre-wrap")}>
//               {content}
//             </div>
//           ) : (
//             <div>
//               <Button
//                 variant="ghost"
//                 className="w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   params.handleRunHypothesis("original", [
//                     {
//                       cellId: cellData.cellId,
//                       columnId: colDef.cellRendererParams.columnId,
//                     },
//                   ]);
//                 }}
//               >
//                 <PlayIcon className="w-4 h-4" />
//               </Button>
//             </div>
//           )}
//         </div>
//       </PopoverTrigger>
//       <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
//         <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh]">
//           <PromptPlayground
//             prompt={formatPromptForPlayground() || ""}
//             selectedInput={data}
//             onSubmit={(history, model) => {
//               setShowPromptPlayground(false);
//             }}
//             submitText="Save"
//             initialModel={prompt?.model || ""}
//             isPromptCreatedFromUi={false}
//             defaultEditMode={false}
//             editMode={false}
//             playgroundMode="experiment"
//             chatType="response"
//           />
//         </ScrollArea>
//       </PopoverContent>
//     </Popover>
//   );
// };
