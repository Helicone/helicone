import React from "react";
import { Button } from "@/components/ui/button";

interface ChatPlaygroundFooterProps {
  onBack: () => void;
  onContinue: () => void;
}

const ChatPlaygroundFooter: React.FC<ChatPlaygroundFooterProps> = ({
  onBack,
  onContinue,
}) => {
  return (
    <div
      id="step-inc"
      className="w-full flex justify-between sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-[#17191d]"
    >
      <Button variant={"secondary"} size={"sm"} onClick={onBack}>
        Back
      </Button>
      <Button size={"sm"} onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
};

export default ChatPlaygroundFooter;
