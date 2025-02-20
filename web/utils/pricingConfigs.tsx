import { Package, FlaskConical, ClipboardCheck } from "lucide-react";

export const ADDONS = [
  {
    id: "prompts",
    name: "Prompts",
    description: "Track, version and iterate.",
    price: 50,
    icon: <Package className="w-6 h-6 text-sky-500" />,
  },
  {
    id: "experiments",
    name: "Experiments",
    description: "Test prompts at scale.",
    price: 50,
    icon: <FlaskConical className="w-6 h-6 text-sky-500" />,
  },
  {
    id: "evals",
    name: "Evals",
    description: "Quantify LLM outputs.",
    price: 100,
    icon: <ClipboardCheck className="w-6 h-6 text-sky-500" />,
  },
] as const;
