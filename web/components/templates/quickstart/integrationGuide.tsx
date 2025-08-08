import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";
import { getRouterCode } from "../gateway/routerUseDialog";

const baseUrl = `${process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL}/v1`;

const IntegrationGuide = () => {
  return (
    <div 
      className="w-full border border-border bg-background rounded-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        <Tabs defaultValue="curl" className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <TabsList className="w-auto">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="curl" className="mt-2">
            <DiffHighlight
              code={getRouterCode(baseUrl, "curl")}
              language="bash"
              newLines={[]}
              oldLines={[]}
              minHeight={false}
              maxHeight={false}
              textSize="sm"
              marginTop={false}
            />
          </TabsContent>

          <TabsContent value="javascript" className="mt-2">
            <DiffHighlight
              code={getRouterCode(baseUrl, "javascript")}
              language="typescript"
              newLines={[]}
              oldLines={[]}
              minHeight={false}
              maxHeight={false}
              textSize="sm"
              marginTop={false}
            />
          </TabsContent>

          <TabsContent value="python" className="mt-2">
            <DiffHighlight
              code={getRouterCode(baseUrl, "python")}
              language="python"
              newLines={[]}
              oldLines={[]}
              minHeight={false}
              maxHeight={false}
              textSize="sm"
              marginTop={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IntegrationGuide; 