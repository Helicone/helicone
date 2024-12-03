import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  CheckIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { modelInfo as openAIModelInfo } from "@/packages/cost/providers/openai";
import { modelInfo as anthropicModelInfo } from "@/packages/cost/providers/anthropic";
import { useRouter } from "next/navigation";

interface ModelSelectorProps {
  modelA: string;
  modelB: string;
  providerA: string;
  providerB: string;
  setModelA: (model: string) => void;
  setModelB: (model: string) => void;
}

const ModelSelector = ({
  modelA,
  modelB,
  providerA,
  providerB,
  setModelA,
  setModelB,
}: ModelSelectorProps) => {
  const router = useRouter();

  const createComparisonPath = (
    modelA: string,
    modelB: string,
    providerA: string,
    providerB: string
  ) => {
    const model1Path = `${encodeURIComponent(modelA)}-on-${encodeURIComponent(
      providerA
    )}`;
    const model2Path = `${encodeURIComponent(modelB)}-on-${encodeURIComponent(
      providerB
    )}`;
    return `/comparison/${model1Path}-vs-${model2Path}`;
  };

  const handleModelASelect = (model: string) => {
    setModelA(model);
    if (modelB) {
      router.push(createComparisonPath(model, modelB, providerA, providerB));
    }
  };

  const handleModelBSelect = (model: string) => {
    setModelB(model);
    if (modelA) {
      router.push(createComparisonPath(modelA, model, providerA, providerB));
    }
  };

  const openAIModels = Object.keys(openAIModelInfo);
  const anthropicModels = Object.keys(anthropicModelInfo);
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-[minmax(200px,_500px)_50px_minmax(200px,_500px)] gap-4 justify-center items-center max-w-[1000px] mx-auto w-full px-4">
      <div className="w-full min-w-0">
        <div className="h-9 justify-start items-center gap-3 inline-flex w-full">
          <Badge className="px-2 py-1 bg-[#ef4544]/20 text-[#ef4544] text-[14px] font-semibold font-['Inter'] leading-tight hover:bg-[#ef4544]/20 whitespace-nowrap">
            Model A
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="flex-1 w-full min-w-0">
              <Button
                variant="outline"
                className="h-9 px-3 py-2 bg-white rounded-md border border-slate-300 justify-between items-center truncate w-full"
              >
                <span className="text-slate-700 text-base font-semibold font-['Inter'] leading-tight truncate">
                  {modelA}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="start"
              style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>OpenAI</DropdownMenuLabel>
                {openAIModels.map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => handleModelASelect(model)}
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Anthropic</DropdownMenuLabel>
                {anthropicModels.map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => handleModelASelect(model)}
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex justify-center items-center">
        <span className="text-black text-base font-medium font-['Inter'] leading-tight">
          vs.
        </span>
      </div>

      <div className="w-full min-w-0">
        <div className="h-9 justify-start items-center gap-3 inline-flex w-full">
          <Badge className="px-2 py-1 bg-[#2563eb]/20 text-[#2563eb] text-[14px] font-semibold font-['Inter'] leading-tight hover:bg-[#2563eb]/20 whitespace-nowrap">
            Model B
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="flex-1 w-full min-w-0">
              <Button
                variant="outline"
                className="w-full h-9 px-3 py-2 bg-white rounded-md border border-slate-300 justify-between items-center truncate w-full"
              >
                <span className="text-slate-700 text-base font-semibold font-['Inter'] leading-tight truncate">
                  {modelB}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="start"
              style={{ width: "var(--radix-dropdown-menu-trigger-width)" }}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>OpenAI</DropdownMenuLabel>
                {openAIModels.map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => handleModelBSelect(model)}
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Anthropic</DropdownMenuLabel>
                {anthropicModels.map((model) => (
                  <DropdownMenuItem
                    key={model}
                    onClick={() => handleModelBSelect(model)}
                  >
                    {model}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
