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
      className="sticky bottom-0 flex w-full justify-between border-t border-gray-300 bg-gray-100 py-4 dark:border-gray-700 dark:bg-[#17191d]"
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
