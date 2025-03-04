import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const OpenRouterSettings = () => {
  const jawn = getJawnClient();

  const currentOpenRouterSettings = useQuery({
    queryKey: ["openrouter:apiKey"],
    queryFn: async () => {
      return jawn.GET("/v1/admin/settings/{name}", {
        params: {
          path: {
            name: "openrouter:apiKey",
          },
        },
      });
    },
  });

  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    if (currentOpenRouterSettings.data?.data) {
      if ("apiKey" in currentOpenRouterSettings.data.data) {
        setApiKey(currentOpenRouterSettings.data.data.apiKey || "");
      }
    }
  }, [currentOpenRouterSettings.data]);

  const { setNotification } = useNotification();

  const [revealApiKey, setRevealApiKey] = useState<boolean>(false);

  return (
    <div className="flex flex-col space-y-4 p-6">
      <h1 className="text-2xl font-semibold">On Prem Settings</h1>
      <div className="flex flex-col space-y-8 max-w-4xl">
        <Card className="bg-slate-200">
          <CardHeader>
            <CardTitle>OpenRouter Settings</CardTitle>
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
                      name: "openrouter:apiKey",
                      settings: {
                        apiKey: apiKey,
                      },
                    },
                  })
                  .then((response) => {
                    if (response.response.ok) {
                      setNotification("Settings saved", "success");
                    } else {
                      setNotification("Failed to save settings", "error");
                      console.log(response.response);
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
