import { useEffect, useState, ChangeEvent, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { H1, H3, H4, P, Muted } from "@/components/ui/typography";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Github,
  Loader,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import useNotification from "@/components/shared/notification/useNotification";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { HeliconeFeatureSelector } from "@/components/onboarding/HeliconeFeatureSelector";

// Define the IntegrationStatus interface
interface IntegrationStatus {
  id: string;
  organization_id: string;
  repository_url: string;
  status: string;
  progress: number;
  completed: boolean;
  error?: string;
  pr_url?: string;
  recent_logs: any[];
  created_at: string;
  updated_at: string;
}

export default function GitHubIntegratePage() {
  const org = useOrg();
  const router = useRouter();
  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [prCreated, setPrCreated] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationStage, setIntegrationStage] = useState<string | null>(null);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] =
    useState<IntegrationStatus | null>(null);
  const { updateCurrentStep } = useOrgOnboarding(org?.currentOrg?.id ?? "");
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [greptileApiKey, setGreptileApiKey] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Polling control - use a single global interval ID
  const [isPolling, setIsPolling] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const pollStatusRef = useRef<(() => Promise<void>) | null>(null);

  // Add Jawn client
  const jawn = useJawnClient();

  const [selectedFeatures, setSelectedFeatures] = useState<
    Record<string, boolean>
  >({
    prompts: true, // Default to Prompts enabled
  });

  useEffect(() => {
    if (org?.currentOrg?.id) {
      updateCurrentStep("INTEGRATION");
    }
  }, [org?.currentOrg?.id]);

  // Validate GitHub repo URL
  useEffect(() => {
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
    setIsValidUrl(githubUrlRegex.test(repoUrl));
  }, [repoUrl]);

  // Clean up polling on component unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        console.log("UNMOUNT: Clearing interval");
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []);

  // Single function to poll for status
  const pollStatus = useCallback(async () => {
    if (!integrationId || isRunningRef.current) return;

    isRunningRef.current = true;

    try {
      console.log(`Polling for ${integrationId}`);

      // Use Jawn client to get integration status
      const result = await jawn.GET(
        "/v1/organization/github-integration/{integrationId}",
        {
          params: {
            path: {
              integrationId,
            },
          },
        }
      );

      if (!result.data?.data) {
        console.error("Error fetching status");
        return;
      }

      const statusData = result.data.data;
      console.log("Status data:", statusData);

      setIntegrationStatus(statusData);
      setIntegrationStage(statusData.status);
      setLastUpdated(new Date());

      // If completed, stop polling
      if (statusData.completed) {
        console.log("COMPLETED: Stopping polling");

        // Update UI
        if (statusData.error) {
          setError(statusData.error);
          setNotification("Integration failed: " + statusData.error, "error");
        } else if (statusData.pr_url) {
          setPrUrl(statusData.pr_url);
          setPrCreated(true);
          setNotification("Pull request created successfully!", "success");
        }

        setIsLoading(false);

        // Stop polling
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
          setIsPolling(false);
        }
      }
    } catch (error: any) {
      console.error("Error polling status:", error);
      setError(error.message || "An error occurred while checking status");
    } finally {
      isRunningRef.current = false;
    }
  }, [integrationId, jawn, setNotification]);

  // Keep the ref updated with the latest pollStatus
  useEffect(() => {
    pollStatusRef.current = pollStatus;
  }, [pollStatus]);

  // Effect to handle polling setup and cleanup
  useEffect(() => {
    // Clear any existing interval first
    if (intervalIdRef.current) {
      console.log("Clearing existing interval");
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      setIsPolling(false);
    }

    if (!integrationId) return;

    // Start new polling
    console.log(`Starting polling for ${integrationId}`);
    setIsPolling(true);

    // Initial poll
    if (pollStatusRef.current) {
      pollStatusRef.current();
    }

    // Set up interval with a single approach
    intervalIdRef.current = setInterval(() => {
      if (pollStatusRef.current) {
        pollStatusRef.current();
      }
    }, 3000);

    // Clean up on unmount or when integrationId changes
    return () => {
      console.log(`Cleaning up polling for ${integrationId}`);
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        setIsPolling(false);
      }
    };
  }, [integrationId]); // Remove pollStatus from dependencies

  // Function to manually refresh status
  const refreshStatus = useCallback(() => {
    if (integrationId) {
      pollStatus();
      setLastUpdated(new Date());
    }
  }, [integrationId, pollStatus]);

  // Function to create PR
  const createPR = async () => {
    // Clear any existing state
    setIsCreatingPR(true);
    setError(null);
    setPrUrl(null);
    setIntegrationStage("Initializing...");
    setPrCreated(false);
    setLastUpdated(new Date());
    setIntegrationStatus(null);

    // Stop any existing polling
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      setIsPolling(false);
    }

    // Clear any existing integrationId
    setIntegrationId(null);
    setIsLoading(true);

    try {
      // Get the list of selected feature IDs
      const selectedFeatureIds = Object.entries(selectedFeatures)
        .filter(([_, isSelected]) => isSelected)
        .map(([id, _]) => id);

      // Use Jawn client to create GitHub integration
      const result = await jawn.POST(
        "/v1/organization/{organizationId}/github-integration",
        {
          params: {
            path: {
              organizationId: org?.currentOrg?.id || "",
            },
          },
          body: {
            repository_url: repoUrl,
            github_token: githubToken,
            selected_features: selectedFeatureIds, // Pass selected features to the API
          },
        }
      );

      if (!result.data?.data) {
        const errorMessage = "Failed to create PR";
        setError(errorMessage);
        setIntegrationStage("Error");
        setNotification(errorMessage, "error");
        setIsLoading(false);
      } else {
        console.log(`Received integration: ${result.data.data.id}`);
        setIntegrationId(result.data.data.id);
        setIntegrationStage("Processing");
        setNotification("Integration started successfully", "success");
        // Polling will be started automatically by the useEffect when integrationId changes
      }
    } catch (error: any) {
      console.error("Error creating PR:", error);
      setError("An unexpected error occurred");
      setIntegrationStage("Error");
      setNotification("An unexpected error occurred", "error");
      setIsLoading(false);
    } finally {
      setIsCreatingPR(false);
    }
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  return (
    <OnboardingHeader>
      <div className="flex flex-col gap-6 mx-auto max-w-4xl py-12">
        <div className="flex flex-col gap-2">
          <H1>GitHub Integration</H1>
          <Muted>
            Connect your GitHub repository to automatically integrate Helicone.
          </Muted>
        </div>

        <Card className="border border-border">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <H3>How it works</H3>
                <P>
                  We'll analyze your repository and create a pull request that
                  integrates Helicone with your codebase. This includes:
                </P>
                <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                  <li>Adding Helicone SDK dependencies</li>
                  <li>Configuring API keys and environment variables</li>
                  <li>Integrating Helicone with your LLM API calls</li>
                  <li>Adding logging and monitoring features</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  <P className="font-medium">Powered by Greptile</P>
                </div>
                <P>
                  We use Greptile's AI-powered code analysis to identify LLM API
                  calls in your codebase and automatically create a pull request
                  with Helicone integration.
                </P>
                <div className="bg-muted/30 p-3 rounded-md border border-border mt-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Note:</span> This process
                    requires:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 mt-1">
                    <li>A valid Greptile API key</li>
                    <li>A GitHub token with repository access</li>
                    <li>A public or private GitHub repository</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    The integration process may take 5-10 minutes for small
                    repositories and longer for larger codebases.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="greptile-api-key">Greptile API Key</Label>
                <Input
                  id="greptile-api-key"
                  type="password"
                  placeholder="grp_..."
                  value={greptileApiKey}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setGreptileApiKey(e.target.value)
                  }
                  disabled={isCreatingPR}
                  className={
                    greptileApiKey && !greptileApiKey.startsWith("grp_")
                      ? "border-yellow-500"
                      : ""
                  }
                />
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <a
                    href="https://app.greptile.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    Get a Greptile API Key{" "}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                  <p className="text-xs">
                    Greptile v2 API keys start with "grp_". Make sure you're
                    using a v2 API key.
                  </p>
                  {greptileApiKey && !greptileApiKey.startsWith("grp_") && (
                    <p className="text-xs text-yellow-500">
                      Warning: Your API key doesn't start with "grp_". Greptile
                      v2 API keys should start with "grp_".
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="github-token">
                  GitHub Personal Access Token
                </Label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="github_pat_..."
                  value={githubToken}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setGithubToken(e.target.value)
                  }
                  disabled={isCreatingPR}
                />
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <a
                    href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    Create a GitHub Personal Access Token{" "}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                  <p className="text-xs mt-1">
                    Your token needs the{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      repo
                    </code>{" "}
                    scope to clone repositories and create pull requests.
                  </p>
                  <p className="text-xs mt-1">
                    For Greptile v2 API, the GitHub token is passed in the{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      X-Github-Token
                    </code>{" "}
                    header.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  GitHub Repository URL
                </label>
                <Input
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setRepoUrl(e.target.value)
                  }
                  disabled={isCreatingPR}
                  className={!isValidUrl && repoUrl ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the full URL of your GitHub repository (e.g.,
                  https://github.com/username/repository)
                </p>
                {repoUrl && !isValidUrl && (
                  <p className="text-sm text-destructive">
                    Please enter a valid GitHub repository URL in the format
                    https://github.com/username/repository
                  </p>
                )}
              </div>

              <div className="mt-4">
                <HeliconeFeatureSelector
                  selectedFeatures={selectedFeatures}
                  onChange={setSelectedFeatures}
                />
              </div>

              <Button
                onClick={createPR}
                disabled={
                  !repoUrl ||
                  !isValidUrl ||
                  !greptileApiKey ||
                  !githubToken ||
                  isCreatingPR
                }
                className="relative"
              >
                {isCreatingPR ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {integrationStage || "Creating PR..."}
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Create Integration PR
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>{error}</p>
                      <p className="text-sm">
                        This could be due to:
                        <ul className="list-disc list-inside ml-2 mt-1">
                          <li>Invalid API keys</li>
                          <li>Repository access issues</li>
                          <li>Network connectivity problems</li>
                        </ul>
                      </p>
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer hover:underline">
                          Show technical details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted/50 rounded-md text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto">
                          {error}
                        </pre>
                      </details>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {prUrl && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2">
                      <P>
                        Pull request created successfully with Helicone
                        integration changes.
                      </P>
                      <ul className="list-disc list-inside text-sm ml-2">
                        <li>Modified API calls to use Helicone</li>
                        <li>Added necessary environment variables</li>
                        <li>Updated documentation</li>
                      </ul>
                      <div className="mt-4">
                        <Link
                          href={prUrl}
                          target="_blank"
                          className="text-primary hover:underline flex items-center"
                        >
                          View Pull Request{" "}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                      <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border">
                        <p className="text-sm font-medium">Next steps:</p>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground ml-2 mt-1">
                          <li>Review the changes in the pull request</li>
                          <li>Merge the pull request to your main branch</li>
                          <li>
                            Add your Helicone API key to your environment
                            variables
                          </li>
                          <li>
                            Deploy your application with Helicone integration
                          </li>
                          <li>
                            Visit{" "}
                            <a
                              href="https://app.helicone.ai"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Helicone Dashboard
                            </a>{" "}
                            to view your API usage
                          </li>
                        </ol>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {integrationStage && !error && !prUrl && (
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{integrationStage}</p>
                    <p className="text-xs text-muted-foreground">
                      {(integrationStatus?.progress || 0) < 60
                        ? "This may take 5-10 minutes..."
                        : "Almost there..."}
                    </p>
                  </div>
                  <Progress
                    value={integrationStatus?.progress || 0}
                    className="h-2"
                  />

                  {/* Display current stage details */}
                  <div className="bg-muted/30 p-3 rounded-md border border-border">
                    <div className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin text-primary" />
                      <p className="text-sm font-medium">
                        {(integrationStatus?.progress || 0) < 20 &&
                          "Checking repository status..."}
                        {(integrationStatus?.progress || 0) >= 20 &&
                          (integrationStatus?.progress || 0) < 50 &&
                          "Indexing repository..."}
                        {(integrationStatus?.progress || 0) >= 50 &&
                          (integrationStatus?.progress || 0) < 80 &&
                          "Analyzing repository for LLM API calls..."}
                        {(integrationStatus?.progress || 0) >= 80 &&
                          "Creating pull request..."}
                      </p>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      {(integrationStatus?.progress || 0) < 20 && (
                        <p>
                          Verifying repository access and checking if it's
                          already indexed by Greptile.
                        </p>
                      )}
                      {(integrationStatus?.progress || 0) >= 20 &&
                        (integrationStatus?.progress || 0) < 50 && (
                          <>
                            <p>
                              Greptile is indexing your repository. This may
                              take several minutes depending on the size of your
                              codebase.
                            </p>
                            <p className="mt-1">
                              The indexing process creates a searchable
                              representation of your code that allows Greptile
                              to understand its structure and identify LLM API
                              calls.
                            </p>
                          </>
                        )}
                      {(integrationStatus?.progress || 0) >= 50 &&
                        (integrationStatus?.progress || 0) < 80 && (
                          <>
                            <p>
                              Analyzing your codebase to identify LLM API calls
                              and determine how to integrate Helicone.
                            </p>
                            <p className="mt-1">
                              Greptile is using AI to locate all LLM API calls
                              and generate the necessary code changes to
                              integrate Helicone monitoring. This includes:
                            </p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground ml-4 mt-1">
                              <li>Identifying API client configurations</li>
                              <li>Adding Helicone proxy configurations</li>
                              <li>Updating API call headers</li>
                              <li>Adding environment variables</li>
                            </ul>
                          </>
                        )}
                      {(integrationStatus?.progress || 0) >= 80 && (
                        <>
                          <p>
                            Creating a pull request with the necessary changes
                            to integrate Helicone with your LLM API calls.
                          </p>
                          <p className="mt-1">
                            This includes adding Helicone SDK dependencies,
                            configuring environment variables, and modifying API
                            calls to include Helicone headers and proxies.
                          </p>
                          <p className="mt-1">
                            The changes will be made in a new branch and
                            submitted as a pull request for your review. You'll
                            be able to see all the changes before merging.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Display recent logs */}
                  {integrationStatus?.recent_logs &&
                    integrationStatus.recent_logs.length > 0 && (
                      <div className="mt-4 border border-border rounded-md p-4 bg-muted/50 max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            Integration Logs:
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              Last updated:{" "}
                              {lastUpdated
                                ? lastUpdated.toLocaleTimeString()
                                : new Date().toLocaleTimeString()}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={refreshStatus}
                            >
                              <ArrowRight className="h-3.5 w-3.5 rotate-90" />
                              <span className="sr-only">Refresh</span>
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {integrationStatus.recent_logs.map((log, index) => (
                            <p
                              key={index}
                              className="text-xs font-mono text-muted-foreground"
                            >
                              {log}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Add a manual refresh button */}
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={refreshStatus}
                      className="text-xs"
                    >
                      <ArrowRight className="h-3.5 w-3.5 rotate-90 mr-1" />
                      Refresh Status
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Link
            href="https://docs.helicone.ai/getting-started/integration-methods"
            target="_blank"
          >
            <Button
              variant="link"
              className="h-auto w-fit p-0 text-[hsl(var(--primary))]"
            >
              Learn more about integration methods
              <ExternalLink size={16} className="ml-2" />
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="w-fit"
            onClick={() => router.push("/dashboard")}
            disabled={isLoading}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </OnboardingHeader>
  );
}
