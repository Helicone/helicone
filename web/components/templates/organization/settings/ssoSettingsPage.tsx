import { useOrg } from "@/components/layout/org/organizationContext";
import {
  SettingsContainer,
  SettingsSection,
} from "@/components/ui/settings-container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XSmall, Muted } from "@/components/ui/typography";
import {
  CopyIcon,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";
import Link from "next/link";
import { useState } from "react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useMutation, useQuery } from "@tanstack/react-query";

type SSOMetadataResponse = {
  data?: {
    data?: { verificationToken: string } | null;
    error?: string | null;
  } | null;
  error?: string;
};

type SSOVerifyResponse = {
  data?: {
    data?: { verified: boolean; ssoConfigured?: boolean } | null;
    error?: string | null;
  } | null;
  error?: string;
};

const SUPABASE_PROJECT_REFS = {
  us: "bolqqmqbrciybnyvpklh",
  eu: "lmahfbbnchpworytrrqk",
};

const getRegion = (): "us" | "eu" => {
  if (typeof window === "undefined") return "us";
  const url = window.location.href;
  if (url.includes("eu.helicone") || url.includes("eu-")) return "eu";
  return "us";
};

const SSOSettingsPage = () => {
  const org = useOrg();
  const jawn = useJawnClient();
  const { setNotification } = useNotification();
  const region = getRegion();
  const projectRef = SUPABASE_PROJECT_REFS[region];
  const [idpMetadataUrl, setIdpMetadataUrl] = useState("");
  const [domain, setDomain] = useState("");

  const isPaidPlan = org?.currentOrg?.tier !== "free";

  const ssoUrls = {
    acsUrl: `https://${projectRef}.supabase.co/auth/v1/sso/saml/acs`,
    entityId: `https://${projectRef}.supabase.co/auth/v1/sso/saml/metadata`,
    relayState: `https://${region}.helicone.ai/dashboard`,
  };

  // Fetch existing SSO config
  const {
    data: ssoConfig,
    isLoading: isLoadingConfig,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ["sso-config", org?.currentOrg?.id],
    queryFn: async () => {
      const response = await jawn.GET("/v1/organization/sso");
      return response.data;
    },
    enabled: isPaidPlan,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification("Copied to clipboard", "success");
  };

  const submitIdpMetadata = useMutation({
    mutationFn: async (params: {
      metadataUrl: string;
      domain: string;
    }): Promise<SSOMetadataResponse> => {
      const response = await jawn.POST("/v1/organization/sso/metadata", {
        body: {
          metadataUrl: params.metadataUrl,
          domain: params.domain,
        },
      });
      return response as SSOMetadataResponse;
    },
    onSuccess: (response: SSOMetadataResponse) => {
      if (response.error || response.data?.error) {
        setNotification(
          String(response.error || response.data?.error) ||
            "Failed to submit SSO configuration",
          "error"
        );
      } else {
        setNotification(
          "SSO configuration submitted. Please add the DNS TXT record to verify your domain.",
          "success"
        );
        refetchConfig();
      }
    },
    onError: () => {
      setNotification("Failed to submit SSO configuration", "error");
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async (): Promise<SSOVerifyResponse> => {
      const response = await jawn.POST("/v1/organization/sso/verify-domain", {});
      return response as SSOVerifyResponse;
    },
    onSuccess: (response: SSOVerifyResponse) => {
      if (response.error || response.data?.error) {
        setNotification(
          String(response.error || response.data?.error),
          "error"
        );
      } else if (response.data?.data?.verified) {
        if (response.data?.data?.ssoConfigured) {
          setNotification(
            "Domain verified and SSO configured successfully!",
            "success"
          );
        } else {
          setNotification(
            "Domain verified! SSO configuration in progress.",
            "success"
          );
        }
        refetchConfig();
      } else {
        setNotification(
          "DNS record not found. Please make sure you've added the TXT record and wait for DNS propagation (this can take up to 48 hours).",
          "error"
        );
      }
    },
    onError: () => {
      setNotification("Failed to verify domain", "error");
    },
  });

  const handleSubmitMetadata = () => {
    if (!idpMetadataUrl.trim()) {
      setNotification("Please enter a valid IdP metadata URL", "error");
      return;
    }
    if (!domain.trim()) {
      setNotification("Please enter your email domain", "error");
      return;
    }
    submitIdpMetadata.mutate({ metadataUrl: idpMetadataUrl, domain });
  };

  const UrlField = ({
    label,
    value,
    description,
  }: {
    label: string;
    value: string;
    description?: string;
  }) => (
    <div className="space-y-1">
      <Label htmlFor={label}>
        <XSmall className="font-medium">{label}</XSmall>
      </Label>
      {description && <Muted className="text-xs">{description}</Muted>}
      <div className="flex flex-row items-center gap-2">
        <Input
          id={label}
          value={value}
          className="max-w-[600px] text-xs"
          readOnly
        />
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => copyToClipboard(value)}
        >
          <CopyIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  if (!isPaidPlan) {
    return (
      <SettingsContainer>
        <SettingsSection title="Single Sign-On (SSO)">
          <div className="flex flex-col gap-4">
            <Muted>
              SSO is available on paid plans. Upgrade your plan to enable
              SAML-based single sign-on for your organization.
            </Muted>
            <Link href="/settings/billing">
              <Button variant="outline" size="sm">
                View Billing Options
              </Button>
            </Link>
          </div>
        </SettingsSection>
      </SettingsContainer>
    );
  }

  if (isLoadingConfig) {
    return (
      <SettingsContainer>
        <SettingsSection title="Single Sign-On (SSO)">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <Muted>Loading SSO configuration...</Muted>
          </div>
        </SettingsSection>
      </SettingsContainer>
    );
  }

  const existingConfig = ssoConfig?.data;
  const isConfigured = existingConfig?.status === "configured";
  const isPendingVerification =
    existingConfig?.status === "pending_verification";
  const isVerified = existingConfig?.domainVerified;

  return (
    <SettingsContainer>
      {/* SSO Status Banner */}
      {isConfigured && (
        <div className="mx-6 mt-6 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <XSmall className="font-medium text-green-800 dark:text-green-200">
              SSO is configured and active
            </XSmall>
            <Muted className="text-xs text-green-700 dark:text-green-300">
              Users with @{existingConfig?.domain} emails can sign in using SSO.
            </Muted>
          </div>
        </div>
      )}

      <SettingsSection
        title="Service Provider Configuration"
        description="Use these values when configuring Helicone as a service provider in your identity provider."
      >
        <div className="flex flex-col gap-4">
          <UrlField
            label="ACS URL (Assertion Consumer Service)"
            value={ssoUrls.acsUrl}
            description="The endpoint that receives SAML assertions from your IdP"
          />
          <UrlField
            label="Entity ID (SP Metadata URL)"
            value={ssoUrls.entityId}
            description="Unique identifier for Helicone as a service provider"
          />
          <UrlField
            label="Relay State"
            value={ssoUrls.relayState}
            description="Where users are redirected after successful authentication"
          />
        </div>
      </SettingsSection>

      {/* Show verification instructions if pending */}
      {isPendingVerification && existingConfig?.verificationToken && (
        <SettingsSection
          title="Domain Verification"
          description="Add a DNS TXT record to verify ownership of your domain."
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col gap-2">
                  <XSmall className="font-medium text-amber-800 dark:text-amber-200">
                    Pending domain verification for {existingConfig.domain}
                  </XSmall>
                  <Muted className="text-xs text-amber-700 dark:text-amber-300">
                    Add the following TXT record to your DNS configuration:
                  </Muted>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>
                <XSmall className="font-medium">DNS Record Type</XSmall>
              </Label>
              <Input value="TXT" className="max-w-[600px] text-xs" readOnly />
            </div>

            <div className="space-y-1">
              <Label>
                <XSmall className="font-medium">Host / Name</XSmall>
              </Label>
              <Muted className="text-xs">
                Use @ or leave empty for the root domain
              </Muted>
              <div className="flex flex-row items-center gap-2">
                <Input
                  value="@"
                  className="max-w-[600px] text-xs"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => copyToClipboard("@")}
                >
                  <CopyIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>
                <XSmall className="font-medium">Value / Content</XSmall>
              </Label>
              <div className="flex flex-row items-center gap-2">
                <Input
                  value={existingConfig.verificationToken}
                  className="max-w-[600px] text-xs font-mono"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    copyToClipboard(existingConfig.verificationToken)
                  }
                >
                  <CopyIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="mt-2">
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={() => verifyDomain.mutate()}
                disabled={verifyDomain.isPending}
              >
                {verifyDomain.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Domain"
                )}
              </Button>
            </div>

            <Muted className="text-xs">
              DNS changes can take up to 48 hours to propagate. If verification
              fails, please wait and try again.
            </Muted>
          </div>
        </SettingsSection>
      )}

      {/* Show form if not configured or not pending verification */}
      {!isConfigured && !isPendingVerification && (
        <SettingsSection
          title="Identity Provider Configuration"
          description="Provide your IdP metadata URL and email domain to enable SSO for your organization."
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label htmlFor="domain">
                <XSmall className="font-medium">Email Domain</XSmall>
              </Label>
              <Muted className="text-xs">
                The email domain for users who will sign in with SSO. For
                example, if your users sign in with example@company.com, enter
                company.com
              </Muted>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="company.com"
                className="max-w-[600px] text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="idp-metadata">
                <XSmall className="font-medium">IdP Metadata URL</XSmall>
              </Label>
              <Muted className="text-xs">
                The URL to your identity provider&apos;s SAML metadata XML
              </Muted>
              <Input
                id="idp-metadata"
                value={idpMetadataUrl}
                onChange={(e) => setIdpMetadataUrl(e.target.value)}
                placeholder="https://your-idp.com/saml/metadata"
                className="max-w-[600px] text-xs"
              />
            </div>

            <div>
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={handleSubmitMetadata}
                disabled={
                  submitIdpMetadata.isPending ||
                  !idpMetadataUrl.trim() ||
                  !domain.trim()
                }
              >
                {submitIdpMetadata.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Continue to Domain Verification"
                )}
              </Button>
            </div>

            <div className="rounded-md border border-border bg-muted/50 p-4">
              <Muted className="text-xs">
                After submitting, you&apos;ll need to add a DNS TXT record to
                verify domain ownership. Once verified, SSO will be
                automatically configured. For assistance, contact{" "}
                <a
                  href="mailto:support@helicone.ai"
                  className="text-primary underline"
                >
                  support@helicone.ai
                </a>
              </Muted>
            </div>
          </div>
        </SettingsSection>
      )}

      <div className="px-6 pb-6">
        <Link
          href="https://docs.helicone.ai/features/enterprise/sso"
          target="_blank"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Learn more about SSO setup
          <ExternalLink size={12} />
        </Link>
      </div>
    </SettingsContainer>
  );
};

export default SSOSettingsPage;
