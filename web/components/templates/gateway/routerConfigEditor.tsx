import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as yaml from "js-yaml";
import { Loader2, Settings, Code2, FormInput } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
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
  const [yamlError, setYamlError] = useState<string | null>(null);

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

  // Debounced YAML parsing
  useEffect(() => {
    if (activeTab === "yaml") {
      const timeoutId = setTimeout(() => {
        try {
          const obj = yaml.load(config);
          parseConfigToForm(obj);
          setYamlError(null);
        } catch (e) {
          setYamlError("Invalid YAML format");
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [config, activeTab, parseConfigToForm]);

  const handleConfigSave = async () => {
    if (!validateLoadBalance()) {
      return;
    }

    let obj;

    try {
      if (activeTab === "form") {
        // Generate config from form values
        const generatedYaml = generateYaml();
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
    if (
      ("valid" in result && (!result.valid || result.error)) ||
      ("error" in result && result.error)
    ) {
      setNotification(
        `Invalid router config: ${result.error || "Unknown error"}`,
        "error",
      );
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

  const validateLoadBalance = () => {
    if (
      state.loadBalance.type === "model-latency" &&
      state.loadBalance.inner.some((item) => typeof item !== "string")
    ) {
      setNotification("Model latency strategy requires string values", "error");
      return false;
    }
    if (
      state.loadBalance.type === "model-weighted" &&
      state.loadBalance.inner.some(
        (item) =>
          typeof item !== "object" || !("model" in item && "weight" in item),
      )
    ) {
      setNotification(
        "Model weighted strategy requires object values",
        "error",
      );
      return false;
    }

    return true;
  };

  // Sync form values to YAML when switching tabs
  const handleTabChange = (value: string) => {
    // handle type check for load balance
    if (!validateLoadBalance()) {
      return;
    }

    if (value === "yaml" && activeTab === "form") {
      // Generate YAML from form values
      setConfig(generateYaml());
      setYamlError(null);
    } else if (value === "form" && activeTab === "yaml") {
      // Parse YAML to form values immediately when switching to form
      try {
        const obj = yaml.load(config);
        parseConfigToForm(obj);
        setYamlError(null);
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
      <Drawer
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        // direction="right"
      >
        <DrawerContent
          // className="fixed bottom-2 right-2 top-2 h-full w-full max-w-lg outline-none"
          className="h-[90vh]"
        >
          <DrawerHeader>
            <DrawerTitle>Router Configuration</DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4">
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

              <TabsContent
                value="form"
                className="mt-4 max-h-full overflow-y-auto"
              >
                <div className="space-y-4">
                  <RouterConfigForm state={state} onStateChange={setState} />
                </div>
              </TabsContent>

              <TabsContent value="yaml" className="mt-4">
                <div className="h-[400px]">
                  {yamlError && (
                    <div className="mb-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                      {yamlError}
                    </div>
                  )}
                  <MarkdownEditor
                    monaco
                    text={config}
                    setText={(value) => {
                      setConfig(value);
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
          </div>

          <DrawerFooter>
            <div className="flex w-full flex-row items-center justify-end space-x-2">
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
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default RouterConfigEditor;
