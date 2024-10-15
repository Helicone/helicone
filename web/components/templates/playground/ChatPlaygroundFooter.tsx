import React from "react";
import HcButton from "../../ui/hcButton";

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
      <HcButton
        variant={"secondary"}
        size={"sm"}
        title={"Back"}
        onClick={onBack}
      />
      <HcButton
        variant={"primary"}
        size={"sm"}
        title={"Continue"}
        onClick={onContinue}
      />
    </div>
  );
};

export default ChatPlaygroundFooter;
