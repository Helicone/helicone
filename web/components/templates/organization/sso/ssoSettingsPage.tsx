import { useState } from "react";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  SettingsContainer,
  SettingsSection,
} from "@/components/ui/settings-container";
import { Small, Muted, XSmall } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Shield, Loader2, Trash2 } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { getJawnClient } from "@/lib/clients/jawn";
import { env } from "next-runtime-env";

// Tiers that have access to SSO
const SSO_ALLOWED_TIERS = ["team-20250130", "growth", "enterprise"];

interface SSOConfig {
  id: string;
  organizationId: string;
  domain: string;
  providerId: string | null;
  metadataUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SSOSettingsPage() {
  const org = useOrg();
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();

  const [domain, setDomain] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const tier = org?.currentOrg?.tier;
  const hasAccess = tier ? SSO_ALLOWED_TIERS.includes(tier) : false;
  const orgId = org?.currentOrg?.id;

  // Supabase URL for SSO configuration - uses the same env var as _app.tsx
  // This is the URL customers need to configure in their IdP (Okta, Azure AD, etc.)
  // IMPORTANT: Must match SUPABASE_URL consistently (localhost vs 127.0.0.1 matters for SAML!)
  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL") || "http://localhost:54321";

  // These are the values customers need to add to their Identity Provider (Okta, Azure AD, etc.)
  // ACS URL = Assertion Consumer Service - where the IdP sends the SAML response after authentication
  // Entity ID = Unique identifier for Helicone as a Service Provider
  const acsUrl = `${supabaseUrl}/sso/saml/acs`;
  const entityId = `${supabaseUrl}/sso/saml/metadata`;

  // Fetch existing SSO config
  const { data: ssoConfig, isLoading } = useQuery<SSOConfig | null>({
    queryKey: ["sso-config", orgId],
    queryFn: async (): Promise<SSOConfig | null> => {
      const jawn = getJawnClient(orgId);
      const response = await jawn.GET("/v1/organization/sso" as any);
      const data = response.data as any;
      if (data?.data) {
        return data.data as SSOConfig;
      }
      return null;
    },
    enabled: Boolean(orgId && hasAccess),
  });

  // Create SSO config mutation
  const createMutation = useMutation({
    mutationFn: async (data: { domain: string; metadataUrl: string }) => {
      const jawn = getJawnClient(orgId);
      const response = await jawn.POST("/v1/organization/sso" as any, {
        body: data,
      });
      const responseData = response as any;
      if (responseData.error) {
        throw new Error(
          typeof responseData.error === "string"
            ? responseData.error
            : "Failed to create SSO configuration"
        );
      }
      return responseData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-config"] });
      setNotification("SSO configuration saved", "success");
      setDomain("");
      setMetadataUrl("");
    },
    onError: (error: Error) => {
      setNotification(error.message, "error");
    },
  });

  // Update SSO config mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      domain?: string;
      metadataUrl?: string;
      enabled?: boolean;
    }) => {
      const jawn = getJawnClient(orgId);
      const response = await jawn.PUT("/v1/organization/sso" as any, {
        body: data,
      });
      const responseData = response as any;
      if (responseData.error) {
        throw new Error(
          typeof responseData.error === "string"
            ? responseData.error
            : "Failed to update SSO configuration"
        );
      }
      return responseData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-config"] });
      setNotification("SSO configuration updated", "success");
      setIsEditing(false);
    },
    onError: (error: Error) => {
      setNotification(error.message, "error");
    },
  });

  // Delete SSO config mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(orgId);
      const response = await jawn.DELETE("/v1/organization/sso" as any);
      const responseData = response as any;
      if (responseData.error) {
        throw new Error(
          typeof responseData.error === "string"
            ? responseData.error
            : "Failed to delete SSO configuration"
        );
      }
      return responseData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sso-config"] });
      setNotification("SSO configuration removed", "success");
    },
    onError: (error: Error) => {
      setNotification(error.message, "error");
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification(`${label} copied to clipboard`, "success");
  };

  const handleSave = () => {
    if (!domain || !metadataUrl) {
      setNotification("Please fill in all fields", "error");
      return;
    }
    createMutation.mutate({ domain, metadataUrl });
  };

  const handleUpdate = () => {
    if (!domain || !metadataUrl) {
      setNotification("Please fill in all fields", "error");
      return;
    }
    updateMutation.mutate({ domain, metadataUrl });
  };

  const handleToggleEnabled = (enabled: boolean) => {
    updateMutation.mutate({ enabled });
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to remove SSO configuration? Users will no longer be able to sign in with SSO."
      )
    ) {
      deleteMutation.mutate();
    }
  };

  // Show upgrade prompt for non-team users
  if (!hasAccess) {
    return (
      <SettingsContainer>
        <SettingsSection title="Single Sign-On (SSO)">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="rounded-full bg-muted p-4">
              <Shield size={32} className="text-muted-foreground" />
            </div>
            <div className="text-center">
              <Small className="font-semibold">
                Enterprise SSO is available on Team plans and above
              </Small>
              <Muted className="mt-1 block">
                Allow your team to sign in with your corporate identity provider
                (Okta, Azure AD, Google Workspace, etc.)
              </Muted>
            </div>
            <Button onClick={() => setShowUpgradeDialog(true)}>
              Upgrade to Team
            </Button>
          </div>
        </SettingsSection>

        <UpgradeProDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
        />
      </SettingsContainer>
    );
  }

  if (isLoading) {
    return (
      <SettingsContainer>
        <SettingsSection title="Single Sign-On (SSO)">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </SettingsSection>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <SettingsSection
        title="Single Sign-On (SSO)"
        description="Allow your team to sign in with your corporate identity provider"
      >
        {ssoConfig ? (
          // Existing config view
          <div className="flex flex-col gap-6">
            {/* Status */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Shield
                  size={20}
                  className={
                    ssoConfig.enabled
                      ? "text-confirmative"
                      : "text-muted-foreground"
                  }
                />
                <div>
                  <Small className="font-medium">SSO Status</Small>
                  <Muted className="block text-xs">
                    {ssoConfig.enabled
                      ? `Users with @${ssoConfig.domain} emails will use SSO`
                      : "SSO is configured but not enabled"}
                  </Muted>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={ssoConfig.enabled ? "default" : "secondary"}
                  className={
                    ssoConfig.enabled
                      ? "bg-confirmative text-confirmative-foreground"
                      : ""
                  }
                >
                  {ssoConfig.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={ssoConfig.enabled}
                  onCheckedChange={handleToggleEnabled}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            {/* Current config */}
            {!isEditing ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <Label>
                    <XSmall className="font-medium text-muted-foreground">
                      Email Domain
                    </XSmall>
                  </Label>
                  <div className="text-sm">{ssoConfig.domain}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>
                    <XSmall className="font-medium text-muted-foreground">
                      Metadata URL
                    </XSmall>
                  </Label>
                  <div className="break-all text-sm">
                    {ssoConfig.metadataUrl}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDomain(ssoConfig.domain);
                      setMetadataUrl(ssoConfig.metadataUrl || "");
                      setIsEditing(true);
                    }}
                  >
                    Edit Configuration
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={14} className="mr-1" />
                    Remove SSO
                  </Button>
                </div>
              </div>
            ) : (
              // Edit form
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-domain">
                    <XSmall className="font-medium">Email Domain</XSmall>
                  </Label>
                  <Input
                    id="edit-domain"
                    placeholder="yourcompany.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-metadata">
                    <XSmall className="font-medium">Metadata URL</XSmall>
                  </Label>
                  <Input
                    id="edit-metadata"
                    placeholder="https://your-idp.com/saml/metadata"
                    value={metadataUrl}
                    onChange={(e) => setMetadataUrl(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Setup form
          <div className="flex flex-col gap-6">
            {/* Step 1: IdP Configuration Info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <Small className="font-medium">
                Step 1: Configure your Identity Provider
              </Small>
              <Muted className="mt-1 block text-xs">
                Add these values to your IdP (Okta, Azure AD, Google Workspace,
                etc.)
              </Muted>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <XSmall className="text-muted-foreground">ACS URL</XSmall>
                    <code className="mt-1 block truncate rounded bg-background px-2 py-1 text-xs">
                      {acsUrl}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(acsUrl, "ACS URL")}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <XSmall className="text-muted-foreground">Entity ID</XSmall>
                    <code className="mt-1 block truncate rounded bg-background px-2 py-1 text-xs">
                      {entityId}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(entityId, "Entity ID")}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <XSmall className="text-muted-foreground">
                      NameID Format
                    </XSmall>
                    <code className="mt-1 block truncate rounded bg-background px-2 py-1 text-xs">
                      emailAddress
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard("emailAddress", "NameID Format")
                    }
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 2: Enter IdP Details */}
            <div className="flex flex-col gap-4">
              <div>
                <Small className="font-medium">
                  Step 2: Enter your IdP details
                </Small>
                <Muted className="mt-1 block text-xs">
                  After configuring your IdP, enter the details below
                </Muted>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="domain">
                  <XSmall className="font-medium">Email Domain</XSmall>
                </Label>
                <Input
                  id="domain"
                  placeholder="yourcompany.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="max-w-md"
                />
                <Muted className="text-xs">
                  Users with this email domain will use SSO to sign in
                </Muted>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="metadata-url">
                  <XSmall className="font-medium">Metadata URL</XSmall>
                </Label>
                <Input
                  id="metadata-url"
                  placeholder="https://your-idp.com/app/xxx/sso/saml/metadata"
                  value={metadataUrl}
                  onChange={(e) => setMetadataUrl(e.target.value)}
                  className="max-w-md"
                />
                <Muted className="text-xs">
                  Found in your IdP&apos;s SAML app settings
                </Muted>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || !domain || !metadataUrl}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Documentation">
        <div className="flex flex-col gap-2">
          <a
            href="https://docs.helicone.ai/features/enterprise/sso"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink size={14} />
            SSO Setup Guide
          </a>
          <a
            href="https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink size={14} />
            Supabase SAML Documentation
          </a>
        </div>
      </SettingsSection>
    </SettingsContainer>
  );
}
