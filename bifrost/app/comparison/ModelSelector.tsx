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
import { parentModelNames } from "@helicone-package/cost/providers/mappings";
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
  <div className="w-full flex-1">
    <div className="inline-flex h-9 w-full items-center justify-start gap-3">
      <Badge
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
        className="whitespace-nowrap px-2 py-1 font-['Inter'] text-[14px] font-semibold leading-tight hover:bg-opacity-20"
      >
        {label}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full items-center justify-between truncate rounded-md border border-slate-300 px-3 py-2"
          >
            <span className="truncate font-['Inter'] text-base font-semibold leading-tight text-slate-700">
              {selectedModel || "Select a model"}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="start"
          className="overflow-y-auto"
          style={{
            width: "var(--radix-dropdown-menu-trigger-width)",
            maxHeight: "var(--radix-dropdown-menu-content-available-height)",
          }}
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
    <div className="mx-auto flex w-full flex-col items-center justify-center gap-2 md:flex-row">
      <ModelDropdown
        label="Model A"
        selectedModel={modelA}
        onSelect={handleModelASelect}
        color="#ef4544"
      />
      <div className="mx-4 flex items-center justify-center">
        <span className="font-['Inter'] text-base font-medium leading-tight text-black">
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
