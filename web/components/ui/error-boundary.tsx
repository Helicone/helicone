import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import { XCircleIcon } from "@heroicons/react/24/solid";
import posthog from "posthog-js";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Add a copy to clipboard function
function CopyButton({
  text,
  label = "Copy",
}: {
  text: string | null | undefined;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
      aria-label={`Copy ${label} to clipboard`}
      disabled={!text}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    // Define a state variable to track whether is an error or not
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    console.log("getDerivedStateFromError", error);
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo, hasError: true, error });
    console.error("Uncaught error:", error, errorInfo);

    // Add PostHog event
    posthog.capture("error_boundary_triggered", {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      errorType: "class_component",
    });
  }

  public render() {
    if (this.state.hasError) {
      // Create a full error report for copying
      const errorReport = `
Error: ${this.state.error?.name || ""}
Message: ${this.state.error?.message || ""}
Environment: ${process.env.NODE_ENV || "unknown"}
Stack Trace: ${this.state.error?.stack || ""}
Component Stack: ${this.state.errorInfo?.componentStack || ""}
Time: ${new Date().toISOString()}
      `.trim();

      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl w-full space-y-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-center">
                <XCircleIcon className="h-12 w-12 text-red-500" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong.
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We apologize for the inconvenience. The error has been logged
                and we&apos;ll look into it.
              </p>
              {this.state.error && (
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Error details:
                    </h3>
                    <CopyButton
                      text={errorReport}
                      label="Copy full error report"
                    />
                  </div>
                  <div className="mt-2 text-sm bg-red-50 border border-red-200 rounded-md overflow-hidden">
                    <div className="bg-red-100 px-4 py-2 font-medium text-red-800 flex justify-between items-center">
                      <span>{this.state.error.name}</span>
                      <span className="text-xs bg-red-200 px-2 py-1 rounded-full">
                        {process.env.NODE_ENV}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-red-700 font-medium">
                        {this.state.error.message}
                      </p>
                      {this.state.error.stack && (
                        <div className="mt-2 relative">
                          <div className="absolute top-2 right-2 z-10">
                            <CopyButton
                              text={this.state.error.stack || ""}
                              label="Copy stack"
                            />
                          </div>
                          <pre className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 overflow-auto max-h-60 whitespace-pre-wrap">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-md font-medium text-gray-900">
                          Component Stack:
                        </h4>
                        <CopyButton
                          text={this.state.errorInfo.componentStack}
                          label="Copy component stack"
                        />
                      </div>
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 overflow-auto max-h-60 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex flex-col space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add a new component to handle event errors
export function ErrorBoundaryWithHandler({
  children,
}: {
  children: ReactNode;
}) {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      // Add PostHog event
      posthog.capture("error_boundary_triggered", {
        error: error.toString(),
        errorType: "functional_component",
      });
    }
  }, [error]);

  if (error) {
    // Create a full error report for copying
    const errorReport = `
Error: ${error?.name || ""}
Message: ${error?.message || ""}
Environment: ${process.env.NODE_ENV || "unknown"}
Stack Trace: ${error?.stack || ""}
Time: ${new Date().toISOString()}
    `.trim();

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full space-y-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center justify-center">
              <XCircleIcon className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Oops! Something went wrong.
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We apologize for the inconvenience. The error has been logged and
              we&apos;ll look into it.
            </p>
            {error && (
              <div className="mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Error details:
                  </h3>
                  <CopyButton
                    text={errorReport}
                    label="Copy full error report"
                  />
                </div>
                <div className="mt-2 text-sm bg-red-50 border border-red-200 rounded-md overflow-hidden">
                  <div className="bg-red-100 px-4 py-2 font-medium text-red-800 flex justify-between items-center">
                    <span>{error.name}</span>
                    <span className="text-xs bg-red-200 px-2 py-1 rounded-full">
                      {process.env.NODE_ENV}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-red-700 font-medium">{error.message}</p>
                    {error.stack && (
                      <div className="mt-2 relative">
                        <div className="absolute top-2 right-2 z-10">
                          <CopyButton
                            text={error.stack || ""}
                            label="Copy stack"
                          />
                        </div>
                        <pre className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 overflow-auto max-h-60 whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-col space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
