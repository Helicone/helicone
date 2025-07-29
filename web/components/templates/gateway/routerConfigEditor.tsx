import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import yaml from "js-yaml";
import { Loader2, Settings, Code2, FormInput } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";
import ThemedDrawer from "@/components/shared/themed/themedDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownEditor from "@/components/shared/markdownEditor";
import useGatewayRouter from "./useGatewayRouter";
import RouterConfigForm from "./RouterConfigForm";
import { useRouterConfig } from "./useRouterConfig";

interface RouterConfigEditorProps {
  routerHash: string;
  gatewayRouter: any;
}

const RouterConfigEditor = ({
  routerHash,
  gatewayRouter,
}: RouterConfigEditorProps) => {
  const [config, setConfig] = useState<string>("");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "yaml">("form");

  // Use the shared router config hook
  const { state, setState, parseConfigToForm, generateYaml } =
    useRouterConfig();

  const { updateGatewayRouter, isUpdatingGatewayRouter, validateRouterConfig } =
    useGatewayRouter({ routerHash });
  const { setNotification } = useNotification();

  useEffect(() => {
    if (gatewayRouter) {
      const yamlString = yaml.dump(gatewayRouter.data?.config);
      setConfig(yamlString);
      parseConfigToForm(gatewayRouter.data?.config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatewayRouter]);

  const handleConfigSave = async () => {
    let obj;

    try {
      if (activeTab === "form") {
        // Generate config from form values
        const generatedYaml = generateYaml(false);
        obj = yaml.load(generatedYaml);
      } else {
        // Use the YAML editor content
        obj = yaml.load(config);
      }
    } catch (e) {
      setNotification("Invalid YAML format", "error");
      return;
    }

    const result = await validateRouterConfig(obj);
    if (!result.valid || result.error) {
      setNotification("Invalid router config", "error");
      return;
    }

    updateGatewayRouter({
      params: {
        path: {
          routerHash: routerHash,
        },
      },
      body: {
        name: gatewayRouter?.data?.name ?? "",
        config: JSON.stringify(obj),
      },
    });

    setConfigModalOpen(false);
    setNotification("Configuration saved successfully", "success");
  };

  // Sync form values to YAML when switching tabs
  const handleTabChange = (value: string) => {
    if (value === "yaml" && activeTab === "form") {
      // Generate YAML from form values
      setConfig(generateYaml(false));
    } else if (value === "form" && activeTab === "yaml") {
      // Parse YAML to form values
      try {
        const obj = yaml.load(config);
        parseConfigToForm(obj);
      } catch (e) {
        setNotification("Invalid YAML format", "error");
      }
    }
    setActiveTab(value as "form" | "yaml");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfigModalOpen(true)}
      >
        <Settings className="mr-2 h-4 w-4" />
        Configuration
      </Button>
      <ThemedDrawer
        open={configModalOpen}
        setOpen={setConfigModalOpen}
        defaultWidth="w-[80vw]"
        defaultExpanded={true}
        actions={
          <div className="flex w-full flex-row items-center justify-between">
            <div className="text-lg font-semibold">Router Configuration</div>
            <div className="flex h-12 flex-row items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setConfigModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={isUpdatingGatewayRouter}
                onClick={handleConfigSave}
              >
                {isUpdatingGatewayRouter ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </div>
          </div>
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="h-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              Form Editor
            </TabsTrigger>
            <TabsTrigger value="yaml" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              YAML Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-4 max-h-full overflow-y-auto">
            <div className="space-y-4">
              <RouterConfigForm
                state={state}
                onStateChange={setState}
                mode="edit"
                showLoadBalance={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="yaml" className="mt-4">
            <div className="h-[400px]">
              <MarkdownEditor
                monaco
                text={config}
                setText={(value) => {
                  setConfig(value);
                  try {
                    parseConfigToForm(yaml.load(value));
                  } catch (e) {
                    setNotification("Invalid YAML format", "error");
                  }
                }}
                disabled={false}
                language="yaml"
                monacoOptions={{
                  lineNumbers: "on",
                  tabSize: 2,
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </ThemedDrawer>
    </>
  );
};

export default RouterConfigEditor;
