import { use, useEffect, useState } from "react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import AlertBanners from "./panels/alertBanners";
import KafkaSettings from "./panels/kafkaSettings";
import OrgMember from "./panels/orgMember";
import TopOrgs from "./panels/topOrgs";
import { useQuery } from "@tanstack/react-query";
import { components } from "../../../lib/clients/jawnTypes/private";
import { useUpdateSetting } from "../../../services/hooks/admin";
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
    const nothingSet = Object.values(settings).some((v) => v === "");
    if (currentAzureSettings.data && nothingSet) {
      const settings = currentAzureSettings.data.data;
      if (settings && "azureBaseUri" in settings) {
        setSettings(settings);
      }
    }
  }, [currentAzureSettings.data]);

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
            <label>API Key</label>
            <input
              type="text"
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
      </ul>
    </div>
  );
};

export default AdminOnPremPage;
