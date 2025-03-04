import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnthropicSettings } from "./AnthropicSettings";
import { AzureSettings } from "./AzureSettings";
import { OpenAISettings } from "./OpenAISettings";
import { OpenRouterSettings } from "./OpenRouterSettings";
interface AdminOnPremPageProps {}

export interface AzureExperiment {
  azureBaseUri: string;
  azureApiVersion: string;
  azureDeploymentName: string;
  azureApiKey: string;
}

export const AdminOnPremPage = (props: AdminOnPremPageProps) => {
  return (
    <div className="flex flex-col space-y-4 p-6">
      <h1 className="text-2xl font-semibold">On Prem Settings</h1>
      <div className="flex flex-col space-y-8 max-w-4xl">
        <Tabs defaultValue="azure" className="w-full">
          <TabsList>
            <TabsTrigger value="azure">Azure</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
          </TabsList>

          <TabsContent value="azure">
            <AzureSettings />
          </TabsContent>

          <TabsContent value="openai">
            <OpenAISettings />
          </TabsContent>

          <TabsContent value="anthropic">
            <AnthropicSettings />
          </TabsContent>

          <TabsContent value="openrouter">
            <OpenRouterSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
