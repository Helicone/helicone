import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";

export const OrganizationStep = ({
  name,
  onNameChange,
}: {
  name: string;
  onNameChange: (name: string) => void;
}) => {
  const [localName, setLocalName] = useState(name);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocalName(name);
  }, [name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalName(newName);
    onNameChange(newName);
    setError(newName ? "" : "Please enter an organization name :)");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-slate-800">Organization</h2>
        <Input
          type="text"
          value={localName}
          onChange={handleNameChange}
          className={`${error ? "border-red-500 text-red-500" : ""}`}
        />
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : localName ? (
          <p className="text-sm font-light text-slate-400">
            Don't worry, you can rename your organization later.
          </p>
        ) : null}
      </div>
    </div>
  );
};
