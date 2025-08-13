import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";
import { getRouterCode } from "../gateway/routerUseDialog";

interface IntegrationGuideProps {
  apiKey?: string;
}

const IntegrationGuide = ({ apiKey }: IntegrationGuideProps) => {
  return (
    <div
      className="w-full rounded-lg bg-background"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 pb-2">
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
              code={getRouterCode("curl", apiKey)}
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
              code={getRouterCode("javascript", apiKey)}
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
              code={getRouterCode("python", apiKey)}
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
