import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Small } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

export const getRouterCode = (language: string, apiKey?: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL
    ? `${process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL}/v1`
    : "https://ai-gateway.helicone.ai";

  if (language === "curl") {
    return `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey ?? "YOUR_HELICONE_API_KEY"}" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ]
  }'`;
  } else if (language === "javascript") {
    return `import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '${apiKey ?? "YOUR_HELICONE_API_KEY"}',
  baseURL: '${baseUrl}',
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'user',
      content: 'Hello, how are you?'
    }
  ]
});`;
  } else if (language === "python") {
    return `from openai import OpenAI

client = OpenAI(
  api_key="${apiKey ?? "YOUR_HELICONE_API_KEY"}",
  base_url="${baseUrl}",
)

completion = client.chat.completions.create(
  model="gpt-4o-mini",
  messages=[
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
)`;
  }

  return "";
};

const RouterUseDialog = ({
  routerHash,
  hideTrigger: _hideTrigger = false,
  open,
  setOpen,
}: {
  routerHash: string;
  hideTrigger?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const baseUrl = `${process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL}/router/${routerHash}`;

  if (!routerHash) {
    return null;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm_sleek"
          className="text-muted-foreground"
        >
          <HelpCircle className="h-3 w-3" />
          <Small className="ml-1 text-muted-foreground">
            How to make a request?
          </Small>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>How to make requests to this router?</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            Use the router hash{" "}
            <code className="rounded bg-muted px-1 py-0.5">{routerHash}</code>{" "}
            in your requests to route them through this gateway.
          </div>

          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="mt-4">
              <DiffHighlight
                code={getRouterCode(baseUrl, "curl")}
                language="bash"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
              />
            </TabsContent>

            <TabsContent value="javascript" className="mt-4">
              <DiffHighlight
                code={getRouterCode(baseUrl, "javascript")}
                language="typescript"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
              />
            </TabsContent>

            <TabsContent value="python" className="mt-4">
              <DiffHighlight
                code={getRouterCode(baseUrl, "python")}
                language="python"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouterUseDialog;
