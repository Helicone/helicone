import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";

interface AdminOnPremPageProps {}

export interface AzureExperiment {
  azureBaseUri: string;
  azureApiVersion: string;
  azureDeploymentName: string;
  azureApiKey: string;
}

const AdminOnPremPage = (props: AdminOnPremPageProps) => {
  const {} = props;

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
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">On Prem Settings</h1>
      <ul className="flex flex-col space-y-8 max-w-4xl">
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-500 p-4 space-y-4">
          <h2>Azure Settings</h2>
          <div
            className="flex flex-col space-y-2"
            style={{ maxWidth: "400px" }}
          >
            <label>Base URI</label>
            <input
              type="text"
              className="text-black"
              value={settings.azureBaseUri}
              onChange={(e) => {
                setSettings({
                  ...settings,
                  azureBaseUri: e.target.value,
                });
              }}
            />
          </div>
          <div
            className="flex flex-col space-y-2"
            style={{ maxWidth: "400px" }}
          >
            <label>API Version</label>
            <input
              type="text"
              className="text-black"
              value={settings.azureApiVersion}
              onChange={(e) => {
                setSettings({
                  ...settings,
                  azureApiVersion: e.target.value,
                });
              }}
            />
          </div>
          <div
            className="flex flex-col space-y-2"
            style={{ maxWidth: "400px" }}
          >
            <label>Deployment Name</label>
            <input
              type="text"
              className="text-black"
              value={settings.azureDeploymentName}
              onChange={(e) => {
                setSettings({
                  ...settings,
                  azureDeploymentName: e.target.value,
                });
              }}
            />
          </div>
          <div
            className="flex flex-col space-y-2"
            style={{ maxWidth: "400px" }}
          >
            <label>
              API Key
              <button
                className="text-blue-500 ml-5 bg-white px-2"
                onClick={() => setRevealApiKey(!revealApiKey)}
              >
                {revealApiKey ? "Hide" : "Reveal"}
              </button>
            </label>
            <input
              type={revealApiKey ? "text" : "password"}
              className="text-black"
              value={settings.azureApiKey}
              onChange={(e) => {
                setSettings({
                  ...settings,
                  azureApiKey: e.target.value,
                });
              }}
            />
          </div>

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
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
          </button>
        </li>
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-500 p-4 space-y-4">
          <h2>Test Azure</h2>
          <textarea
            className="text-black font-mono"
            rows={15}
            value={testMessageBody}
            onChange={(e) => setTestMessageBody(e.target.value)}
          />
          {!isValidJson && <p className="text-red-500">Invalid JSON</p>}
          <button
            disabled={!isValidJson}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
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
                    setNotification("Settings saved", "success");
                  } else {
                    setNotification("Failed to save settings", "error");
                    console.log(s.response);
                  }
                });
            }}
          >
            Test
          </button>

          <div className="flex flex-col space-y-2">
            <label>Result</label>
            {testResult === "loading" && <p>Loading...</p>}
            <h3 className="text-xl">Fetch parameters</h3>
            <h4 className="text-lg">URL</h4>
            {testResult && testResult !== "loading" && (
              <pre>{testResult.fetchParams.url}</pre>
            )}
            <h4 className="text-lg">Headers</h4>
            {testResult && testResult !== "loading" && (
              <pre>
                {JSON.stringify(testResult.fetchParams.headers, null, 2)}
              </pre>
            )}
            <h4 className="text-lg">Body</h4>
            {testResult && testResult !== "loading" && (
              <pre>
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
            )}
            <h3 className="text-xl">Result</h3>
            {testResult && testResult !== "loading" && (
              <pre>
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
            )}
          </div>
        </li>
      </ul>
    </div>
  );
};

export default AdminOnPremPage;
