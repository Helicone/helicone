import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const OpenAISettings = () => {
  const jawn = useJawnClient();

  const currentOpenAISettings = useQuery({
    queryKey: ["openai:apiKey"],
    queryFn: async () => {
      return jawn.GET("/v1/admin/settings/{name}", {
        params: {
          path: {
            name: "openai:apiKey",
          },
        },
      });
    },
  });

  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    if (currentOpenAISettings.data?.data) {
      if ("apiKey" in currentOpenAISettings.data.data) {
        setApiKey(currentOpenAISettings.data.data.apiKey || "");
      }
    }
  }, [currentOpenAISettings.data]);

  const { setNotification } = useNotification();

  const [revealApiKey, setRevealApiKey] = useState<boolean>(false);

  return (
    <div className="flex flex-col space-y-4 p-6">
      <h1 className="text-2xl font-semibold">On Prem Settings</h1>
      <div className="flex flex-col space-y-8 max-w-4xl">
        <Card className="bg-slate-200">
          <CardHeader>
            <CardTitle>OpenAI Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                }}
              />
            </div>

            <Button
              onClick={() => {
                jawn
                  .POST("/v1/admin/settings", {
                    body: {
                      name: "openai:apiKey",
                      settings: {
                        apiKey: apiKey,
                      },
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
      </div>
    </div>
  );
};
