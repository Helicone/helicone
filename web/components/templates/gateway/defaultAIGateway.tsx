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
import { IntegrationCodeTabs } from "@/components/shared/IntegrationCodeTabs";

const DefaultAIGateway = ({ setTabValue }: { setTabValue: () => void }) => {
  return (
    <div className="flex h-full flex-col">
      {/* AI Gateway Getting Started Section */}
      <div className="w-full flex-shrink-0 border border-border bg-background">
        <div className="p-4">
          <div className="mb-2 flex justify-end">
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
                    code examples below.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      Check our{" "}
                      <a
                        href="https://helicone.ai/models"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline"
                      >
                        Model Registry
                      </a>{" "}
                      to see all supported model slugs you can use with the
                      gateway.
                    </p>
                    <p className="text-sm">
                      For more information on how to use the AI Gateway, please
                      refer to the{" "}
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

          <IntegrationCodeTabs />
        </div>
      </div>
    </div>
  );
};

export default DefaultAIGateway;
