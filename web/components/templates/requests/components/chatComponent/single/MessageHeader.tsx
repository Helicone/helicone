import React from "react";
import RoleButton from "../../../../playground/new/roleButton";
import { Message } from "@/packages/llm-mapper/types";

interface MessageHeaderProps {
  message: Message;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({ message }) => (
  <div className="flex items-center justify-center flex-col">
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
