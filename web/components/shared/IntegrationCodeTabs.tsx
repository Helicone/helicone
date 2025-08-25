import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeHighlighter } from "@/components/shared/CodeHighlighter";
import { getRouterCode } from "@/components/templates/gateway/routerUseDialog";

interface IntegrationCodeTabsProps {
  apiKey?: string;
  defaultTab?: "javascript" | "python" | "curl";
  theme?: string;
}

export function IntegrationCodeTabs({
  apiKey,
  defaultTab = "javascript",
  theme = "github-dark",
}: IntegrationCodeTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <TabsList className="w-auto">
          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="javascript" className="mt-2">
        <CodeHighlighter
          code={getRouterCode("javascript", apiKey)}
          language="typescript"
          theme={theme}
        />
      </TabsContent>

      <TabsContent value="python" className="mt-2">
        <CodeHighlighter
          code={getRouterCode("python", apiKey)}
          language="python"
          theme={theme}
        />
      </TabsContent>

      <TabsContent value="curl" className="mt-2">
        <CodeHighlighter
          code={getRouterCode("curl", apiKey)}
          language="bash"
          theme={theme}
        />
      </TabsContent>
    </Tabs>
  );
}
