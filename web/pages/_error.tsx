import { NextPageContext } from "next";
import { Component } from "react";

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

class Error extends Component<ErrorProps> {
  static getInitialProps({ res, err }: NextPageContext): ErrorProps {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode, hasGetInitialPropsRun: true };
  }

  render() {
    const { statusCode } = this.props;
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h1 className="text-center text-2xl font-bold text-gray-900">
              {statusCode
                ? `${statusCode} - Server Error`
                : "Application Error"}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              {statusCode === 404
                ? "This page could not be found."
                : "An error occurred while processing your request."}
            </p>
            <div className="mt-6 flex flex-col space-y-2">
              <button
                onClick={() => window.location.href = "/"}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Go to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Error;