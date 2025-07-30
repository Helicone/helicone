import React from "react";
import RoleButton from "../../../../playground/new/roleButton";
import { Message } from "@helicone-package/llm-mapper/types";

interface MessageHeaderProps {
  message: Message;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-20">
      <RoleButton
        role={message?.role as any}
        onRoleChange={() => {}}
        disabled={true}
        size="small"
      />
    </div>
  </div>
);
