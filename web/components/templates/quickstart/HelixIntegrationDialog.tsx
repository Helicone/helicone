import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, ChevronRight, Bot, FileText } from "lucide-react";
import {
  SiPython,
  SiTypescript,
  SiJavascript,
  SiOpenai,
  SiAnthropic,
  SiGooglegemini,
  SiGoogle,
  SiVercel,
} from "react-icons/si";
import { FaAws } from "react-icons/fa";
import { VscAzure } from "react-icons/vsc";

interface HelixIntegrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

type IntegrationMethod =
  | "ai-gateway"
  | "openai-sdk"
  | "anthropic-sdk"
  | "azure"
  | "bedrock"
  | "gemini"
  | "vertex"
  | "vercel-ai"
  | "other";

type Framework = "python" | "typescript" | "javascript" | "other";

interface IntegrationData {
  method: IntegrationMethod;
  customMethod: string;
  framework: Framework;
  customFramework: string;
  currentCode: string;
  additionalInstructions: string;
}

const integrationMethods = [
  {
    value: "ai-gateway",
    label: "Helicone AI Gateway (Recommended)",
    icon: Bot,
  },
  { value: "openai-sdk", label: "OpenAI SDK", icon: SiOpenai },
  { value: "anthropic-sdk", label: "Anthropic SDK", icon: SiAnthropic },
  { value: "azure", label: "Azure", icon: VscAzure },
  { value: "bedrock", label: "Bedrock", icon: FaAws },
  { value: "gemini", label: "Gemini", icon: SiGooglegemini },
  { value: "vertex", label: "Vertex", icon: SiGoogle },
  { value: "vercel-ai", label: "Vercel AI", icon: SiVercel },
  { value: "other", label: "Other", icon: FileText },
];

const languages = [
  { value: "python", label: "Python", icon: SiPython, color: "text-blue-500" },
  {
    value: "typescript",
    label: "TypeScript",
    icon: SiTypescript,
    color: "text-blue-500",
  },
  {
    value: "javascript",
    label: "JavaScript",
    icon: SiJavascript,
    color: "text-yellow-500",
  },
  { value: "other", label: "Other", icon: FileText, color: "text-gray-500" },
];

const HelixIntegrationDialog = ({
  isOpen,
  onClose,
  onSubmit,
}: HelixIntegrationDialogProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntegrationData>({
    method: "ai-gateway",
    customMethod: "",
    framework: "python",
    customFramework: "",
    currentCode: "",
    additionalInstructions: "",
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const formatMessage = () => {
    const methodNames = {
      "ai-gateway": "Helicone AI Gateway",
      "openai-sdk": "OpenAI SDK",
      "anthropic-sdk": "Anthropic SDK",
      azure: "Azure",
      bedrock: "Bedrock",
      gemini: "Gemini",
      vertex: "Vertex",
      "vercel-ai": "Vercel AI",
      other: data.customMethod || "Other integration method",
    };

    const frameworkNames = {
      python: "Python",
      typescript: "TypeScript",
      javascript: "JavaScript",
      other: data.customFramework || "Other",
    };

    let message = `I'm setting up Helicone integration and need help. Here are my details:\n\n`;
    message += `**Integration Method:** ${data.method === "other" ? data.customMethod : methodNames[data.method]}\n\n`;
    message += `**Framework/Language:** ${data.framework === "other" ? data.customFramework : frameworkNames[data.framework]}\n\n`;

    if (data.currentCode.trim()) {
      const languageMap: Record<string, string> = {
        python: "python",
        typescript: "typescript",
        javascript: "javascript",
        other: "text",
      };
      const lang = languageMap[data.framework] || "text";
      message += `**Current Code:**\n\`\`\`${lang}\n${data.currentCode}\n\`\`\`\n\n`;
    }

    if (data.additionalInstructions.trim()) {
      message += `**Additional Instructions:**\n${data.additionalInstructions}\n\n`;
    }

    message += `I am new to Helicone. Can you help me integrate it into my application?`;

    return message;
  };

  const handleSubmit = () => {
    const message = formatMessage();
    onSubmit(message);
    onClose();
    setStep(1);
    setData({
      method: "ai-gateway",
      customMethod: "",
      framework: "python",
      customFramework: "",
      currentCode: "",
      additionalInstructions: "",
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">
              How would you like to integrate with Helicone?
            </Label>
            <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-md border border-border p-2">
              <RadioGroup
                value={data.method}
                onValueChange={(value) =>
                  setData({ ...data, method: value as IntegrationMethod })
                }
              >
                {integrationMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label
                      key={method.value}
                      htmlFor={method.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
                    >
                      <RadioGroupItem value={method.value} id={method.value} />
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{method.label}</span>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {data.method === "other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-method" className="text-sm">
                  Please specify your integration method
                </Label>
                <Input
                  id="custom-method"
                  placeholder="e.g., Custom REST API, AWS Bedrock, etc."
                  value={data.customMethod}
                  onChange={(e) =>
                    setData({ ...data, customMethod: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">
              What framework or language are you using?
            </Label>
            <RadioGroup
              value={data.framework}
              onValueChange={(value) =>
                setData({ ...data, framework: value as Framework })
              }
            >
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => {
                  const Icon = lang.icon;
                  return (
                    <label
                      key={lang.value}
                      htmlFor={lang.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/50"
                    >
                      <RadioGroupItem value={lang.value} id={lang.value} />
                      <Icon className={`h-4 w-4 ${lang.color}`} />
                      <span>{lang.label}</span>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>

            {data.framework === "other" && (
              <div className="space-y-2">
                <Label htmlFor="custom-framework" className="text-sm">
                  Please specify your framework or language
                </Label>
                <Input
                  id="custom-framework"
                  placeholder="e.g., Java, C#, Ruby, etc."
                  value={data.customFramework}
                  onChange={(e) =>
                    setData({ ...data, customFramework: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                What else should I know?
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-code" className="text-sm font-medium">
                Current Code (optional)
              </Label>
              <Textarea
                id="current-code"
                placeholder="Paste your current LLM code here..."
                className="font-mono min-h-[150px] text-sm"
                value={data.currentCode}
                onChange={(e) =>
                  setData({ ...data, currentCode: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="additional-instructions"
                className="text-sm font-medium"
              >
                Additional Instructions (optional)
              </Label>
              <Textarea
                id="additional-instructions"
                placeholder="Any specific requirements? (e.g., tracking custom properties, streaming, async logging, etc.)"
                className="min-h-[100px]"
                value={data.additionalInstructions}
                onChange={(e) =>
                  setData({ ...data, additionalInstructions: e.target.value })
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Integrate with Helix
          </DialogTitle>
          <DialogDescription>
            Answer 3 questions and get personalized integration help!
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="my-2 flex justify-end text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                Step {step} of {totalSteps}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-12 rounded-full transition-colors ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {renderStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext} className="flex items-center gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex items-center gap-1 bg-primary"
            >
              <Bot className="h-4 w-4" />
              Ask Helix
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelixIntegrationDialog;
