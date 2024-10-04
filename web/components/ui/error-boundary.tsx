import React, { Component, ErrorInfo, ReactNode } from "react";
import { XCircleIcon } from "@heroicons/react/24/solid";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-center">
                <XCircleIcon className="h-12 w-12 text-red-500" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong.
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We apologize for the inconvenience. The error has been logged
                and we'll look into it.
              </p>
              {this.state.error && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Error details:
                  </h3>
                  <pre className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reload Page
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
