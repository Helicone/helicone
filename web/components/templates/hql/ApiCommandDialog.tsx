import { useState, useRef, useEffect } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiCommandDialogProps {
  sql: string;
}

export function ApiCommandDialog({ sql }: ApiCommandDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Escape the SQL for JSON
  const escapedSql = sql.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

  const curlCommand = `curl -X POST "https://api.helicone.ai/v1/helicone-sql/execute" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sql": "${escapedSql}"
  }'`;

  const pythonCommand = `import requests

response = requests.post(
    "https://api.helicone.ai/v1/helicone-sql/execute",
    headers={
        "Authorization": "Bearer <YOUR_API_KEY>",
        "Content-Type": "application/json"
    },
    json={"sql": """${sql.replace(/"""/g, '\\"""')}"""}
)

data = response.json()
print(data)`;

  const nodeCommand = `const response = await fetch("https://api.helicone.ai/v1/helicone-sql/execute", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <YOUR_API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    sql: \`${sql.replace(/`/g, "\\`")}\`
  })
});

const data = await response.json();
console.log(data);`;

  return (
    <Dialog>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Terminal size={16} className="mr-1" />
                API
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Copy REST API command</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>REST API Command</DialogTitle>
          <DialogDescription>
            Use these commands to execute this query programmatically. Replace{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
              {"<YOUR_API_KEY>"}
            </code>{" "}
            with your Helicone API key.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="curl" className="w-full min-h-0 flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="node">Node.js</TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="mt-4 min-h-0 flex-1 overflow-hidden">
            <CodeBlock
              code={curlCommand}
              language="bash"
              copied={copied === "curl"}
              onCopy={() => handleCopy(curlCommand, "curl")}
            />
          </TabsContent>

          <TabsContent value="python" className="mt-4 min-h-0 flex-1 overflow-hidden">
            <CodeBlock
              code={pythonCommand}
              language="python"
              copied={copied === "python"}
              onCopy={() => handleCopy(pythonCommand, "python")}
            />
          </TabsContent>

          <TabsContent value="node" className="mt-4 min-h-0 flex-1 overflow-hidden">
            <CodeBlock
              code={nodeCommand}
              language="javascript"
              copied={copied === "node"}
              onCopy={() => handleCopy(nodeCommand, "node")}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950 shrink-0">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Cost values in the response are stored
            multiplied by 1,000,000,000 for precision. Divide by this value to
            get the actual USD cost.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  copied: boolean;
  onCopy: () => void;
}

function CodeBlock({ code, copied, onCopy }: CodeBlockProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <pre className="max-h-[300px] w-full overflow-x-auto overflow-y-auto rounded-md bg-slate-900 p-4 text-sm text-slate-100">
        <code className="block w-full whitespace-pre-wrap break-words">{code}</code>
      </pre>
      <Button
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 h-8 w-8 p-0"
        onClick={onCopy}
      >
        {copied ? (
          <Check size={14} className="text-green-500" />
        ) : (
          <Copy size={14} />
        )}
      </Button>
    </div>
  );
}
