import { Variable } from "@/types/prompt-state";
import { getVariableStatus, isValidVariableName } from "@/utils/variables";
import { PiWarningCircleBold } from "react-icons/pi";

interface VariablesPanelProps {
  variables: Variable[];
  onVariableChange: (index: number, value: string) => void;
}

export default function VariablesPanel({
  variables,
  onVariableChange,
}: VariablesPanelProps) {
  const validVariables = variables.filter(v => isValidVariableName(v.name));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Variables</h2>
      </div>

      {/* No Variables */}
      {validVariables.length === 0 ? (
        <p className="text-sm text-slate-400 text-center text-balance">
          Make your prompt dynamic with variables. Type{" "}
          <span className="text-heliblue">{`{{name}}`}</span> or highlight a
          value in a message and press ⌘ E.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {/* Variables */}
          {validVariables.map((variable, index) => (
            <div
              key={`${variable.name}-${index}`}
              className="flex flex-col py-2 first:pt-0"
            >
              <div className="flex flex-d items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      variable.value ? "text-heliblue" : "text-red-500"
                    }`}
                  >
                    {variable.name}
                  </span>
                </div>
                <input
                  value={variable.value}
                  onChange={e => onVariableChange(index, e.target.value)}
                  placeholder={`Enter default value for {{${variable.name}}}...`}
                  className="w-[32rem] border border-slate-100 focus:ring-1 focus:ring-heliblue hover:shadow-md rounded-md px-2 py-1"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
