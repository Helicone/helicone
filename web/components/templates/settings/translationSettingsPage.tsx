import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { H2, P, Small, Muted } from "@/components/ui/typography";
import { useTranslationSettings } from "@/services/hooks/useTranslation";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TranslationSettingsPage() {
  const { settings, updateSettings, supportedLanguages, isConfigured } =
    useTranslationSettings();
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestApiKey = async () => {
    if (!settings.apiKey) {
      setTestStatus("error");
      setTestError("Please enter an API key first");
      return;
    }

    setTestStatus("testing");
    setTestError(null);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: "Say 'API key is valid' in 3 words or less.",
              },
            ],
            max_tokens: 10,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API error: ${response.status}`
        );
      }

      setTestStatus("success");
    } catch (error) {
      setTestStatus("error");
      setTestError(
        error instanceof Error ? error.message : "Failed to test API key"
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <H2>Translation Settings</H2>
        <Muted>
          Configure message translation for debugging AI tickets in different
          languages. Translations are performed using your own OpenAI API key.
        </Muted>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <P className="font-medium">Enable Translation</P>
              <Small className="text-muted-foreground">
                Show translate button on chat messages
              </Small>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {settings.enabled && (
        <>
          <Card>
            <CardHeader>
              <P className="font-medium">OpenAI API Key</P>
              <Small className="text-muted-foreground">
                Your API key is stored locally in your browser and is only used
                for translation requests. We recommend using a key with limited
                permissions.
              </Small>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={settings.apiKey}
                      onChange={(e) =>
                        updateSettings({ apiKey: e.target.value })
                      }
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestApiKey}
                    disabled={testStatus === "testing" || !settings.apiKey}
                  >
                    {testStatus === "testing" ? "Testing..." : "Test Key"}
                  </Button>
                </div>
              </div>

              {testStatus === "success" && (
                <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                    API key is valid and working correctly.
                  </AlertDescription>
                </Alert>
              )}

              {testStatus === "error" && testError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <P className="font-medium">Target Language</P>
              <Small className="text-muted-foreground">
                The language to translate messages into
              </Small>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.targetLanguage}
                onValueChange={(value) =>
                  updateSettings({ targetLanguage: value })
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {isConfigured && (
            <Alert className="border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950">
              <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <AlertDescription className="text-sky-700 dark:text-sky-300">
                Translation is enabled. You will see a translate button on chat
                messages when viewing requests.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
