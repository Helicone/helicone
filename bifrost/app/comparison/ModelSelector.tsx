import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { parentModelNames } from "@/packages/cost/providers/mappings";
import { useState } from "react";

interface ModelSelectorProps {
  modelA: string;
  modelB: string;
  providerA: string;
  providerB: string;
}

interface ModelDropdownProps {
  label: string;
  selectedModel: string;
  onSelect: (model: string, provider: string) => void;
  color: string;
}

const ModelDropdown = ({
  label,
  selectedModel,
  onSelect,
  color,
}: ModelDropdownProps) => (
  <div className="flex-1 w-full">
    <div className="h-9 justify-start items-center gap-3 inline-flex w-full">
      <Badge
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
        className="px-2 py-1 text-[14px] font-semibold font-['Inter'] leading-tight whitespace-nowrap hover:bg-opacity-20"
      >
        {label}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex-1 w-full">
          <Button
            variant="outline"
            className="h-9 px-3 py-2 rounded-md border border-slate-300 justify-between items-center truncate w-full"
          >
            <span className="text-slate-700 text-base font-semibold font-['Inter'] leading-tight truncate">
              {selectedModel}
            </span>
            <ChevronDownIcon className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
        >
          {Object.entries(parentModelNames).map(([provider, models]) => (
            <div key={provider}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>{provider}</DropdownMenuLabel>
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => onSelect(model, provider)}
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

const ModelSelector = ({
  modelA: initialModelA,
  modelB: initialModelB,
  providerA: initialProviderA,
  providerB: initialProviderB,
}: ModelSelectorProps) => {
  const router = useRouter();
  const [modelA, setModelA] = useState(initialModelA);
  const [modelB, setModelB] = useState(initialModelB);
  const [providerA, setProviderA] = useState(initialProviderA);
  const [providerB, setProviderB] = useState(initialProviderB);

  const createComparisonPath = (
    modelA: string,
    modelB: string,
    providerA: string,
    providerB: string
  ) => {
    const model1Path = `${encodeURIComponent(modelA)}-on-${encodeURIComponent(
      providerA
    ).toLowerCase()}`;
    const model2Path = `${encodeURIComponent(modelB)}-on-${encodeURIComponent(
      providerB
    ).toLowerCase()}`;
    return `/comparison/${model1Path}-vs-${model2Path}`;
  };

  const handleModelASelect = (model: string, provider: string) => {
    setModelA(model);
    setProviderA(provider);
    if (modelB) {
      router.push(createComparisonPath(model, modelB, provider, providerB));
    }
  };

  const handleModelBSelect = (model: string, provider: string) => {
    setModelB(model);
    setProviderB(provider);
    if (modelA) {
      router.push(createComparisonPath(modelA, model, providerA, provider));
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mx-auto w-full md:flex-row gap-2">
      <ModelDropdown
        label="Model A"
        selectedModel={modelA}
        onSelect={handleModelASelect}
        color="#ef4544"
      />
      <div className="flex justify-center items-center mx-4">
        <span className="text-black text-base font-medium font-['Inter'] leading-tight">
          vs.
        </span>
      </div>
      <ModelDropdown
        label="Model B"
        selectedModel={modelB}
        onSelect={handleModelBSelect}
        color="#2563eb"
      />
    </div>
  );
};

export default ModelSelector;
