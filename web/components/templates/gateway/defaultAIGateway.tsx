import { Small } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { getRouterCode } from "./routerUseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

const baseUrl = `${process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL}/v1`;

const DefaultAIGateway = ({ setTabValue }: { setTabValue: () => void }) => {

  return (
    <div className="flex h-full flex-col">
      {/* Beta Banner */}
      <div className="w-full flex-shrink-0 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex flex-col gap-1">
            <Small className="font-medium text-blue-900 dark:text-blue-100">
              🚀 AI Gateway is in Beta
            </Small>
            <Small className="text-blue-700 dark:text-blue-200">
              This is a new feature that we&apos;re actively improving.
              We&apos;d love to hear your feedback!
            </Small>
          </div>
          <a
            href="https://cal.com/team/helicone/gateway-chat"
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Schedule a Call
          </a>
        </div>
      </div>

      {/* AI Gateway Getting Started Section */}
      <div className="w-full flex-shrink-0 border border-border bg-background">
        <div className="p-4">
          <Tabs defaultValue="curl" className="w-full">
            <div className="mb-2 flex items-center justify-between">
              <TabsList className="w-auto">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Getting Started with AI Gateway</DialogTitle>
                    <DialogDescription>
                      Learn how to use the AI Gateway and access advanced
                      features.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Send your first request to the AI Gateway using one of the
                      code examples above.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        For more information on how to use the AI Gateway,
                        please refer to the{" "}
                        <a
                          href="https://docs.helicone.ai/ai-gateway"
                          className="font-medium text-primary underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          documentation
                        </a>
                      </p>
                      <p className="text-sm">
                        To create custom routers with load balancing, caching,
                        rate limiting and retries strategy,{" "}
                        <button
                          className="font-medium text-primary underline"
                          onClick={() => setTabValue()}
                        >
                          go to My Routers
                        </button>
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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

    </div>
  );
};

export default DefaultAIGateway;
