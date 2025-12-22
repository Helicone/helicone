import { useState, useCallback } from "react";
import { useLocalStorage } from "./localStorage";

export interface TranslationSettings {
  enabled: boolean;
  apiKey: string;
  targetLanguage: string;
}

const DEFAULT_SETTINGS: TranslationSettings = {
  enabled: false,
  apiKey: "",
  targetLanguage: "English",
};

const SUPPORTED_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Arabic",
  "Hindi",
  "Dutch",
  "Polish",
  "Turkish",
  "Vietnamese",
  "Thai",
  "Indonesian",
];

export const useTranslationSettings = () => {
  const [settings, setSettings] = useLocalStorage<TranslationSettings>(
    "translation_settings",
    DEFAULT_SETTINGS
  );

  const updateSettings = useCallback(
    (updates: Partial<TranslationSettings>) => {
      setSettings({ ...settings, ...updates });
    },
    [settings, setSettings]
  );

  return {
    settings,
    updateSettings,
    isConfigured: settings.enabled && settings.apiKey.length > 0,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
};

interface TranslationState {
  [messageId: string]: {
    translatedText: string | null;
    isLoading: boolean;
    error: string | null;
    isShowingTranslation: boolean;
  };
}

export const useTranslation = () => {
  const { settings, isConfigured } = useTranslationSettings();
  const [translations, setTranslations] = useState<TranslationState>({});

  const translateMessage = useCallback(
    async (messageId: string, text: string) => {
      if (!isConfigured || !text.trim()) {
        return;
      }

      // If already translated, just toggle the view
      if (translations[messageId]?.translatedText) {
        setTranslations((prev) => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            isShowingTranslation: !prev[messageId].isShowingTranslation,
          },
        }));
        return;
      }

      // Start loading
      setTranslations((prev) => ({
        ...prev,
        [messageId]: {
          translatedText: null,
          isLoading: true,
          error: null,
          isShowingTranslation: false,
        },
      }));

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
                  role: "system",
                  content: `You are a translator. Translate the following text to ${settings.targetLanguage}. Only respond with the translation, nothing else. Preserve any formatting like markdown, code blocks, bullet points, etc.`,
                },
                {
                  role: "user",
                  content: text,
                },
              ],
              max_tokens: 4096,
              temperature: 0.3,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || `API error: ${response.status}`
          );
        }

        const data = await response.json();
        const translatedText = data.choices?.[0]?.message?.content;

        if (!translatedText) {
          throw new Error("No translation received");
        }

        setTranslations((prev) => ({
          ...prev,
          [messageId]: {
            translatedText,
            isLoading: false,
            error: null,
            isShowingTranslation: true,
          },
        }));
      } catch (error) {
        setTranslations((prev) => ({
          ...prev,
          [messageId]: {
            translatedText: null,
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Translation failed",
            isShowingTranslation: false,
          },
        }));
      }
    },
    [isConfigured, settings.apiKey, settings.targetLanguage, translations]
  );

  const toggleTranslation = useCallback((messageId: string) => {
    setTranslations((prev) => {
      if (!prev[messageId]?.translatedText) {
        return prev;
      }
      return {
        ...prev,
        [messageId]: {
          ...prev[messageId],
          isShowingTranslation: !prev[messageId].isShowingTranslation,
        },
      };
    });
  }, []);

  const getTranslationState = useCallback(
    (messageId: string) => {
      return (
        translations[messageId] || {
          translatedText: null,
          isLoading: false,
          error: null,
          isShowingTranslation: false,
        }
      );
    },
    [translations]
  );

  return {
    translateMessage,
    toggleTranslation,
    getTranslationState,
    isConfigured,
    targetLanguage: settings.targetLanguage,
  };
};
