export type AuthInputType = "password" | "file" | "multi";

export interface AuthTypeConfig {
  label: string;
  inputType: AuthInputType;
  placeholder?: string;
  helpText?: string;
  fields: string[];
  fieldLabels?: Record<string, string>;
}

/**
 * UI configuration for each authentication type
 * This defines how each auth type should be rendered in the UI
 */
export const authTypeUI: Record<string, AuthTypeConfig> = {
  "api-key": {
    label: "API Key",
    inputType: "password",
    placeholder: "Enter your API key...",
    fields: ["apiKey"],
  },
  "service_account": {
    label: "Service Account",
    inputType: "file",
    helpText: "Upload a service account JSON file from Google Cloud Console",
    fields: ["serviceAccount"],
  },
  "aws-signature": {
    label: "AWS Credentials",
    inputType: "multi",
    fields: ["accessKey", "secretKey"],
    fieldLabels: {
      accessKey: "Access Key",
      secretKey: "Secret Key",
    },
  },
  "oauth": {
    label: "OAuth Token",
    inputType: "password",
    placeholder: "Enter OAuth token...",
    fields: ["token"],
  },
} as const;

/**
 * Get auth UI configuration for a given auth type
 */
export function getAuthTypeConfig(authType: string): AuthTypeConfig {
  return authTypeUI[authType] || authTypeUI["api-key"];
}