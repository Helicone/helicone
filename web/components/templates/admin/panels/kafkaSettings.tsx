import { TextInput } from "@tremor/react";
import { useState, useEffect } from "react";
import useNotification from "../../../shared/notification/useNotification";
import {
  useGetSetting,
  useUpdateSetting,
} from "../../../../services/hooks/admin";
import { components } from "../../../../lib/clients/jawnTypes/private";
import { Button } from "@/components/ui/button";
import { H3, Muted, Small } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const settingNames: Array<components["schemas"]["SettingName"]> = [
  "kafka:dlq",
  "kafka:log",
  "kafka:score",
  "kafka:dlq:score",
  "kafka:dlq:eu",
  "kafka:log:eu",
];

const KafkaSettings = () => {
  const { setNotification } = useNotification();

  // States
  const [miniBatchSize, setMiniBatchSize] = useState<number>(0);
  const [selectedSetting, setSelectedSetting] =
    useState<components["schemas"]["SettingName"]>("kafka:dlq");

  // Fetch current setting
  const {
    setting,
    isLoading: isLoadingSetting,
    refetch: refetchSetting,
  } = useGetSetting(selectedSetting, () => {
    if (setting && "miniBatchSize" in setting) {
      setMiniBatchSize(setting.miniBatchSize);
    }
  });

  // Update setting mutation
  const { updateSetting, isUpdatingSetting } = useUpdateSetting(() => {
    setNotification("Setting updated successfully", "success");
    refetchSetting();
  });

  // Effect to update miniBatchSize when setting changes
  useEffect(() => {
    if (setting && "miniBatchSize" in setting) {
      setMiniBatchSize(setting.miniBatchSize);
    }
  }, [setting]);

  return (
    <Card className="w-full">
      <CardHeader>
        <H3>Kafka Settings</H3>
        <Muted>Configure message queue and processing settings</Muted>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Small className="font-medium">Select Configuration</Small>
            <select
              value={selectedSetting}
              onChange={(e) =>
                setSelectedSetting(
                  e.target.value as components["schemas"]["SettingName"]
                )
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {settingNames.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 space-y-2">
              <Small className="font-medium">Mini Batch Size</Small>
              <TextInput
                placeholder="Mini Batch Size"
                value={miniBatchSize.toString()}
                onValueChange={(value) => setMiniBatchSize(Number(value))}
              />
            </div>
            <div className="col-span-1 flex items-end">
              <Button
                className="w-full"
                onClick={() => {
                  if (miniBatchSize != 0 && !miniBatchSize) {
                    setNotification("Mini Batch Size is required", "error");
                    return;
                  }
                  updateSetting({
                    name: selectedSetting,
                    settings: {
                      miniBatchSize,
                    } as components["schemas"]["Setting"],
                  });
                }}
                disabled={isUpdatingSetting || isLoadingSetting}
              >
                Update Setting
              </Button>
            </div>
          </div>

          {isLoadingSetting ? (
            <div className="py-4 flex justify-center">
              <div className="animate-pulse h-5 w-32 bg-muted rounded"></div>
            </div>
          ) : setting ? (
            <div className="rounded-md border border-border p-4 bg-muted/30">
              <Small className="font-medium block mb-2">
                Current Configuration
              </Small>
              <code className="text-xs bg-muted p-2 rounded block whitespace-pre overflow-x-auto">
                {JSON.stringify(setting, null, 2)}
              </code>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default KafkaSettings;
