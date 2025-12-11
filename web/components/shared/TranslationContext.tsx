import React, { createContext, useContext, ReactNode } from "react";
import { useTranslation } from "@/services/hooks/useTranslation";

interface TranslationContextValue {
  translateMessage: (messageId: string, text: string) => Promise<void>;
  toggleTranslation: (messageId: string) => void;
  getTranslationState: (messageId: string) => {
    translatedText: string | null;
    isLoading: boolean;
    error: string | null;
    isShowingTranslation: boolean;
  };
  isConfigured: boolean;
  targetLanguage: string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const translation = useTranslation();

  return (
    <TranslationContext.Provider value={translation}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error(
      "useTranslationContext must be used within a TranslationProvider"
    );
  }
  return context;
};

export const useOptionalTranslationContext = () => {
  return useContext(TranslationContext);
};
