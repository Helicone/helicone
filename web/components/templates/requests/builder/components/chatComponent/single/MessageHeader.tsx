import React from "react";
import RoleButton from "../../../../../playground/new/roleButton";

interface MessageHeaderProps {
  role: string;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({ role }) => (
  <div className="flex items-center justify-center">
    <div className="w-20">
      <RoleButton
        role={role as any}
        onRoleChange={() => {}}
        disabled={true}
        size="small"
      />
    </div>
  </div>
);
