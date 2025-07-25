export const InfoBanner = () => (
  <div className="bg-[#2D7FF9] text-white">
    <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <span className="flex flex-shrink-0 rounded-lg bg-[#1E6FE7] p-2">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </span>
        <p className="ml-3 text-sm font-medium sm:text-base">
          Welcome to the Helicone demo! Complete the onboarding process to
          unlock the full demo on the last step.
        </p>
      </div>
    </div>
  </div>
);
