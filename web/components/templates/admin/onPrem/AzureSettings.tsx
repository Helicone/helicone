import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import useNotification from "@/components/shared/notification/useNotification";
import { useJawnClient } from "@/lib/clients/jawnHook";

export interface AzureExperiment {
  azureBaseUri: string;
  azureApiVersion: string;
  azureDeploymentName: string;
  azureApiKey: string;
}

export const AzureSettings = () => {
  const jawn = useJawnClient();

  const currentAzureSettings = useQuery({
    queryKey: ["azure:experiment"],
    queryFn: async () => {
      return jawn.GET("/v1/admin/settings/{name}", {
        params: {
          path: {
            name: "azure:experiment",
          },
        },
      });
    },
  });

  const [settings, setSettings] = useState<AzureExperiment>({
    azureBaseUri: "",
    azureApiVersion: "",
    azureDeploymentName: "",
    azureApiKey: "",
  });
  const { setNotification } = useNotification();

  useEffect(() => {
    const nothingSet = Object.values(settings).every((v) => v === "");
    if (currentAzureSettings.data && nothingSet) {
      const settings = currentAzureSettings.data.data;
      if (settings && "azureBaseUri" in settings) {
        setSettings(settings);
      }
    }
  }, [currentAzureSettings.data]);

  const [revealApiKey, setRevealApiKey] = useState<boolean>(false);

  const [testMessageBody, setTestMessageBody] = useState<string>(
    JSON.stringify(
      {
        messages: [
          {
            role: "user",
            content: "Please work this should be a simple call",
          },
        ],
        max_tokens: 800,
        temperature: 1,
      },
      null,
      2
    )
  );

  const [isValidJson, setIsValidJson] = useState<boolean>(true);

  useEffect(() => {
    try {
      JSON.parse(testMessageBody);
      setIsValidJson(true);
    } catch (e) {
      setIsValidJson(false);
    }
  }, [testMessageBody]);

  const [testResult, setTestResult] = useState<any | null>(null);

  return (
    <div className="flex flex-col space-y-4 p-6">
      <h1 className="text-2xl font-semibold">On Prem Settings</h1>
      <div className="flex flex-col space-y-8 max-w-4xl">
        <Card className="bg-slate-200">
          <CardHeader>
            <CardTitle>Azure Settings (For experiments)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUri">Base URI</Label>
              <Input
                id="baseUri"
                value={settings.azureBaseUri}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    azureBaseUri: e.target.value,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiVersion">API Version</Label>
              <Input
                id="apiVersion"
                value={settings.azureApiVersion}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    azureApiVersion: e.target.value,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deploymentName">Deployment Name</Label>
              <Input
                id="deploymentName"
                value={settings.azureDeploymentName}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    azureDeploymentName: e.target.value,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">API Key</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealApiKey(!revealApiKey)}
                >
                  {revealApiKey ? "Hide" : "Reveal"}
                </Button>
              </div>
              <Input
                id="apiKey"
                type={revealApiKey ? "text" : "password"}
                value={settings.azureApiKey}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    azureApiKey: e.target.value,
                  });
                }}
              />
            </div>

            <Button
              onClick={() => {
                jawn
                  .POST("/v1/admin/settings", {
                    body: {
                      name: "azure:experiment",
                      settings: settings,
                    },
                  })
                  .then((s) => {
                    if (s.response.ok) {
                      setNotification("Settings saved", "success");
                    } else {
                      setNotification("Failed to save settings", "error");
                      console.log(s.response);
                    }
                  });
              }}
            >
              Save
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-200">
          <CardHeader>
            <CardTitle>Test Azure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="font-mono"
              rows={15}
              value={testMessageBody}
              onChange={(e) => setTestMessageBody(e.target.value)}
            />
            {!isValidJson && <p className="text-destructive">Invalid JSON</p>}
            <Button
              disabled={!isValidJson}
              onClick={() => {
                setTestResult("loading");
                jawn
                  .POST("/v1/admin/azure/run-test", {
                    body: {
                      requestBody: JSON.parse(testMessageBody),
                    },
                  })
                  .then((s) => {
                    setTestResult(s.data);
                    if (s.response.ok) {
                      setNotification("Test completed", "success");
                    } else {
                      setNotification("Test failed", "error");
                      console.log(s.response);
                    }
                  });
              }}
            >
              Test
            </Button>

            <div className="space-y-4">
              <Label>Result</Label>
              {testResult === "loading" && <p>Loading...</p>}

              {testResult && testResult !== "loading" && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Fetch parameters</h3>
                    <h4 className="text-lg font-medium">URL</h4>
                    <pre className="bg-muted p-4 rounded-lg">
                      {testResult.fetchParams.url}
                    </pre>

                    <h4 className="text-lg font-medium">Headers</h4>
                    <pre className="bg-muted p-4 rounded-lg">
                      {JSON.stringify(testResult.fetchParams.headers, null, 2)}
                    </pre>

                    <h4 className="text-lg font-medium">Body</h4>
                    <pre className="bg-muted p-4 rounded-lg">
                      {(() => {
                        try {
                          return JSON.stringify(
                            JSON.parse(testResult.fetchParams.body),
                            null,
                            2
                          );
                        } catch (e) {
                          return testResult.fetchParams.body;
                        }
                      })()}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Result</h3>
                    <pre className="bg-muted p-4 rounded-lg">
                      {(() => {
                        try {
                          return JSON.stringify(
                            JSON.parse(testResult.resultText),
                            null,
                            2
                          );
                        } catch (e) {
                          return testResult.resultText;
                        }
                      })()}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
